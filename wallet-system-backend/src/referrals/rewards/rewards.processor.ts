import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { FulfillmentsService } from '../fulfillments/fulfillments.service';
import { FulfillmentStatus } from '../fulfillments/entities/reward-fulfillment.entity';
import { EmailProducer } from '../../common/email/email.producer';
import { UsersService } from '../../users/users.service';
import { WalletService } from '../../wallet/wallet.service';
import { WalletTransactionSource } from '../../wallet/enums/wallet.enums';

@Processor('rewards')
export class RewardsProcessor extends WorkerHost {
    private readonly logger = new Logger(RewardsProcessor.name);

    constructor(
        private readonly rewardsService: RewardsService,
        private readonly fulfillmentsService: FulfillmentsService,
        private readonly emailProducer: EmailProducer,
        private readonly usersService: UsersService,
        private readonly walletService: WalletService,
    ) {
        super();
    }

    async process(job: Job): Promise<void> {
        this.logger.log(`Processing job ${job.name} [${job.id}]`);

        try {
            switch (job.name) {
                case 'create-plan-fulfillments':
                    await this.createPlanFulfillments(job.data);
                    break;

                case 'create-window-fulfillments':
                    await this.createWindowFulfillments(job.data);
                    break;

                case 'send-fulfillment-notification':
                    await this.sendNotification(job.data);
                    break;

                case 'process-claim-reward':
                    await this.processClaimReward(job.data);
                    break;

                case 'check-window-expirations':
                    // await this.checkWindowExpirations(); // To be implemented later or in service
                    break;
            }
        } catch (error) {
            this.logger.error(`Failed to process job ${job.name}: ${error.message} `, error.stack);
            throw error;
        }
    }

    private async createPlanFulfillments(data: {
        userId: string;
        planId: string;
        subscriptionId: string;
    }) {
        this.logger.log(`Creating plan fulfillments for User: ${data.userId}, Plan: ${data.planId}`);

        // Get the direct reward linked to the plan (via plan.rewardId)
        const directReward = await this.rewardsService.getDirectPlanReward(data.planId);

        if (!directReward) {
            this.logger.warn(`No reward found for plan ${data.planId} - No fulfillments created`);
            return;
        }

        this.logger.log(`Found direct reward: ${directReward.id} (${directReward.name})`);

        try {
            this.logger.log(`Creating fulfillment for reward ${directReward.id} status PENDING_SELECTION`);
            await this.fulfillmentsService.createForPlan(
                data.userId,
                directReward.id,
                data.planId,
                FulfillmentStatus.PENDING_SELECTION
            );
        } catch (err) {
            this.logger.error(`Failed to create fulfillment for reward ${directReward.id}: ${err.message}`, err.stack);
        }
    }

    private async createWindowFulfillments(data: {
        userId: string;
        progressId: string;
        rewardIds: string[];
    }) {
        for (const rewardId of data.rewardIds) {
            await this.fulfillmentsService.createForWindow(
                data.userId,
                rewardId,
                data.progressId,
            );
        }
    }

    async sendNotification(data: {
        userId: string;
        status: string;
        rewardId?: string;
        trackingNumber?: string;
    }) {
        try {
            const user = await this.usersService.findById(data.userId);
            if (!user || !user.email) {
                this.logger.warn(`Cannot send notification: User ${data.userId} has no email`);
                return;
            }

            // Fetch reward details if rewardId provided
            if (data.rewardId) {
                const reward = await this.rewardsService.findById(data.rewardId);
                if (reward) {
                    await this.emailProducer.sendFulfillmentStatusEmail(
                        user.email,
                        reward.name,
                        data.status,
                        reward.type,
                        Number(reward.value),
                    );
                }
            }
        } catch (error) {
            this.logger.error(`Failed to send notification for user ${data.userId}`, error.stack);
        }
    }

    private async processClaimReward(data: {
        userId: string;
        rewardId: string;
        claimType: 'WALLET' | 'PHYSICAL';
        addressId?: string;
        sourceId: string;
        sourceType: 'PLAN' | 'WINDOW';
        fulfillmentId?: string;
    }) {
        const { userId, rewardId, claimType, addressId, sourceId, sourceType, fulfillmentId } = data;

        try {
            this.logger.log(`Processing claim for user ${userId}, reward ${rewardId}, type ${claimType}`);

            // 1. Find existing PENDING_SELECTION fulfillment (eligibility check)
            let fulfillment;
            if (fulfillmentId) {
                fulfillment = await this.fulfillmentsService.findById(fulfillmentId);
                // Security check
                if (fulfillment && (fulfillment.userId !== userId || fulfillment.rewardId !== rewardId || fulfillment.status !== 'PENDING_SELECTION')) {
                    this.logger.warn(`Invalid fulfillment ${fulfillmentId} provided for claim`);
                    return;
                }
            }

            if (!fulfillment) {
                // Fallback lookup if frontend didn't pass ID
                fulfillment = await this.fulfillmentsService.findPendingSelection(
                    userId, rewardId, sourceId, sourceType
                );
            }

            if (!fulfillment) {
                this.logger.warn(`No pending fulfillment found for user ${userId}, reward ${rewardId}`);
                return;
            }

            const reward = await this.rewardsService.findById(rewardId);
            if (!reward) throw new Error(`Reward ${rewardId} not found`);

            // 2. Decrement stock for physical rewards
            if (reward.type === 'PHYSICAL') {
                const stockAvailable = await this.rewardsService.claimStock(rewardId);
                if (!stockAvailable) {
                    this.logger.warn(`Reward ${rewardId} out of stock during claim processing`);
                    return;
                }
            }

            // 3. Process based on claim type
            if (claimType === 'WALLET') {
                await this.walletService.credit(
                    userId,
                    Number(reward.value),
                    WalletTransactionSource.REWARD, // Plan/Window reward claim
                    fulfillment.id, // referenceId links to the fulfillment record
                );
                await this.fulfillmentsService.claimFulfillment(fulfillment.id, 'WALLET');
            } else {
                await this.fulfillmentsService.claimFulfillment(fulfillment.id, 'PHYSICAL', addressId);
            }

            this.logger.log(`Claimed fulfillment ${fulfillment.id} as ${claimType}`);

            // Send notification
            await this.sendNotification({
                userId,
                rewardId,
                status: claimType === 'WALLET' ? 'DELIVERED' : 'PENDING'
            });

        } catch (error) {
            this.logger.error(`Failed to process claim for user ${userId}`, error.stack);
        }
    }
}
