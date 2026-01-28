import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    SubscriptionPurchasedEvent,
    WindowProgressCompletedEvent,
    FulfillmentStatusChangedEvent
} from '../../common/events/domain-events';
import { RewardsService } from './rewards.service';

@Injectable()
export class RewardsListener {
    private readonly logger = new Logger(RewardsListener.name);

    constructor(
        private readonly rewardsService: RewardsService,
        @InjectQueue('rewards') private readonly rewardsQueue: Queue,
    ) { }

    /**
     * When a subscription is purchased, create fulfillments for plan-linked rewards
     */
    @OnEvent('subscription.purchased')
    async handlePlanRewards(event: SubscriptionPurchasedEvent) {
        const { userId, planId, subscriptionId } = event.payload;

        // Add to queue for async processing
        await this.rewardsQueue.add('create-plan-fulfillments', {
            userId,
            planId,
            subscriptionId,
        });
    }

    /**
     * When a window is completed, create fulfillments for window-linked rewards
     */
    @OnEvent('window.progress.completed')
    async handleWindowRewards(event: WindowProgressCompletedEvent) {
        const { userId, progressId, windowId } = event.payload;

        // Get Reward IDs for this window
        // We fetch them here (or in the processor). 
        // Let's pass the window ID and let the processor decide, 
        // but the task payload expects rewardIds. 
        // Actually, in the plan, I passed a list of IDs. 
        // Let's resolve them here to stick to the event payload design, or just update the processor to fetch them.
        // Fetching here is "cleaner" for the event payload, but heavier for the listener.
        // I'll fetch them here.

        try {
            const rewards = await this.rewardsService.getRewardsForWindow(windowId);
            const rewardIds = rewards.map(r => r.id);

            if (rewardIds.length > 0) {
                // Bug #9 Fix: Create Pulfillments (PENDING_SELECTION)
                await this.rewardsQueue.add('create-window-fulfillments', {
                    userId,
                    progressId,
                    rewardIds,
                });
            }
        } catch (error) {
            this.logger.error(`Failed to handle window completion rewards for window ${windowId}`, error.stack);
        }
    }

    /**
     * When fulfillment status changes, send notification
     */
    @OnEvent('fulfillment.status.changed')
    async handleStatusChange(event: FulfillmentStatusChangedEvent) {
        const { userId, newStatus, trackingNumber } = event.payload;

        // Queue notification job
        await this.rewardsQueue.add('send-fulfillment-notification', {
            userId,
            status: newStatus,
            trackingNumber,
        });
    }
    /**
     * When a user requests to claim a reward (Wallet or Physical)
     */
    @OnEvent('reward.claim.requested')
    async handleRewardClaim(event: any) {
        await this.rewardsQueue.add('process-claim-reward', event.payload);
    }
}
