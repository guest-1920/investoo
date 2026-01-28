import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardFulfillment, FulfillmentStatus } from './entities/reward-fulfillment.entity';
import { Reward, RewardType } from '../rewards/entities/reward.entity'; // Need to check if this cross-module import is okay or needs decoupling
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FulfillmentsService {
    private readonly logger = new Logger(FulfillmentsService.name);

    constructor(
        @InjectRepository(RewardFulfillment)
        private readonly fulfillmentRepo: Repository<RewardFulfillment>,
        @InjectRepository(Reward)
        private readonly rewardRepo: Repository<Reward>,
        private readonly eventEmitter: EventEmitter2,
        // Ideally use RewardsService, but that might create cycle if RewardsService uses FulfillmentsService.
        // Since RewardsProcessor calls this, and RewardsProcessor is in RewardsModule...
        // Let's stick to Repo injection here to avoid service loop.
    ) { }

    async createForPlan(userId: string, rewardId: string, planId: string, status?: FulfillmentStatus): Promise<RewardFulfillment> {
        return this.createFulfillment(userId, rewardId, { sourcePlanId: planId, status: FulfillmentStatus.PENDING_SELECTION });
    }

    async createForWindow(userId: string, rewardId: string, progressId: string): Promise<RewardFulfillment> {
        return this.createFulfillment(userId, rewardId, { sourceWindowProgressId: progressId, status: FulfillmentStatus.PENDING_SELECTION });
    }

    private async createFulfillment(
        userId: string,
        rewardId: string,
        source: { sourcePlanId?: string; sourceWindowProgressId?: string; status?: FulfillmentStatus }
    ): Promise<RewardFulfillment> {

        // Fetch reward to check type
        const reward = await this.rewardRepo.findOne({ where: { id: rewardId } });
        if (!reward) throw new Error(`Reward not found: ${rewardId}`);

        // If DIGITAL, we might auto-process or mark PENDING for immediate claim logic
        // For now, standard flow: PENDING

        const fulfillment = this.fulfillmentRepo.create({
            userId,
            rewardId,
            status: source.status || FulfillmentStatus.PENDING,
            ...source,
        });

        const saved = await this.fulfillmentRepo.save(fulfillment);
        this.logger.log(`Created fulfillment ${saved.id} for user ${userId} reward ${rewardId}`);

        // Auto-process DIGITAL rewards? (Future enhancement)

        return saved;
    }

    // ==================== ADMIN METHODS ====================

    /**
     * Find all fulfillments with pagination
     */
    async findAll(pagination: any) {
        const [data, totalItems] = await this.fulfillmentRepo.findAndCount({
            order: { createdAt: 'DESC' },
            skip: pagination.skip || 0,
            take: pagination.take || 10,
            relations: ['reward', 'user', 'address'],
        });

        return {
            data,
            totalItems,
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            totalPages: Math.ceil(totalItems / (pagination.limit || 10)),
        };
    }

    /**
     * Find fulfillments by status
     */
    async findByStatus(status: string, pagination: any) {
        const [data, totalItems] = await this.fulfillmentRepo.findAndCount({
            where: { status: status as FulfillmentStatus },
            order: { createdAt: 'DESC' },
            skip: pagination.skip || 0,
            take: pagination.take || 10,
            relations: ['reward', 'user', 'address'],
        });

        return {
            data,
            totalItems,
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            totalPages: Math.ceil(totalItems / (pagination.limit || 10)),
        };
    }

    /**
     * Find fulfillment by ID
     */
    async findById(id: string): Promise<RewardFulfillment | null> {
        return this.fulfillmentRepo.findOne({
            where: { id },
            relations: ['reward', 'user', 'address'],
        });
    }

    /**
     * Update fulfillment status (Admin)
     */
    async updateStatus(id: string, status: string, trackingNumber?: string, notes?: string): Promise<RewardFulfillment> {
        const fulfillment = await this.fulfillmentRepo.findOne({
            where: { id },
            relations: ['reward', 'user']
        });
        if (!fulfillment) throw new Error(`Fulfillment not found: ${id}`);

        fulfillment.status = status as FulfillmentStatus;
        if (trackingNumber) fulfillment.trackingNumber = trackingNumber;
        if (notes) fulfillment.adminNotes = notes;

        // Set shipped/delivered dates
        if (status === FulfillmentStatus.SHIPPED) {
            fulfillment.shippedAt = new Date();
        } else if (status === FulfillmentStatus.DELIVERED) {
            fulfillment.deliveredAt = new Date();
        }

        const saved = await this.fulfillmentRepo.save(fulfillment);
        this.logger.log(`Updated fulfillment ${id} status to ${status}`);

        // Send email notification for important status changes
        if (fulfillment.user?.email && fulfillment.reward &&
            ['PROCESSING', 'SHIPPED', 'DELIVERED', 'FAILED'].includes(status)) {
            try {
                await this.eventEmitter.emit('fulfillment.status.updated', {
                    email: fulfillment.user.email,
                    rewardName: fulfillment.reward.name,
                    status: status,
                    rewardType: fulfillment.reward.type,
                    rewardValue: Number(fulfillment.reward.value),
                });
            } catch (error) {
                this.logger.error(`Failed to send status update email for fulfillment ${id}`, error);
            }
        }

        return saved;
    }

    // ==================== USER METHODS ====================

    /**
     * Find fulfillments for a user, optionally filtered by status
     */
    async findByUser(userId: string, pagination: any, status?: FulfillmentStatus) {
        const whereClause: any = { userId };
        if (status) {
            whereClause.status = status;
        }

        const [data, totalItems] = await this.fulfillmentRepo.findAndCount({
            where: whereClause,
            order: { createdAt: 'DESC' },
            skip: pagination.skip || 0,
            take: pagination.take || 10,
            relations: ['reward'],
        });

        return {
            data,
            totalItems,
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            totalPages: Math.ceil(totalItems / (pagination.limit || 10)),
        };
    }

    /**
     * Set delivery address for physical reward (User)
     */
    async setDeliveryAddress(userId: string, fulfillmentId: string, addressId: string): Promise<RewardFulfillment> {
        const fulfillment = await this.fulfillmentRepo.findOne({
            where: { id: fulfillmentId, userId }
        });

        if (!fulfillment) {
            throw new Error('Fulfillment not found or does not belong to user');
        }

        fulfillment.addressId = addressId;
        return this.fulfillmentRepo.save(fulfillment);
    }

    // ==================== CLAIM LOGIC ====================

    /**
     * Find pending selection fulfillment for eligibility check
     */
    async findPendingSelection(userId: string, rewardId: string, sourceId: string, sourceType: 'PLAN' | 'WINDOW'): Promise<RewardFulfillment | null> {
        const where: any = {
            userId,
            rewardId,
            status: FulfillmentStatus.PENDING_SELECTION,
        };

        if (sourceType === 'PLAN') {
            where.sourcePlanId = sourceId;
        } else {
            where.sourceWindowProgressId = sourceId;
        }

        return this.fulfillmentRepo.findOne({ where });
    }

    /**
     * Claim an existing PENDING_SELECTION fulfillment
     */
    async claimFulfillment(
        fulfillmentId: string,
        claimType: 'WALLET' | 'PHYSICAL',
        addressId?: string
    ): Promise<RewardFulfillment> {
        const fulfillment = await this.fulfillmentRepo.findOne({
            where: { id: fulfillmentId },
            relations: ['reward']
        });

        if (!fulfillment) throw new Error('Fulfillment not found');
        if (fulfillment.status !== FulfillmentStatus.PENDING_SELECTION) {
            throw new Error(`Fulfillment already claimed or invalid status: ${fulfillment.status}`);
        }

        if (claimType === 'PHYSICAL') {
            fulfillment.status = FulfillmentStatus.PENDING;
            if (addressId) fulfillment.addressId = addressId;
        } else {
            fulfillment.status = FulfillmentStatus.DELIVERED; // WALLET is instant
            fulfillment.deliveredAt = new Date();
        }

        const saved = await this.fulfillmentRepo.save(fulfillment);
        return saved;
    }
}

