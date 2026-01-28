import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './entities/reward.entity';
import { PlanReward } from './entities/plan-reward.entity';
import { WindowReward } from './entities/window-reward.entity';
import { Plan } from '../../plans/plan.entity';
import { ReferralWindow } from '../windows/entities/referral-window.entity';

@Injectable()
export class RewardsService {
    private readonly logger = new Logger(RewardsService.name);

    constructor(
        @InjectRepository(Reward)
        private readonly rewardRepo: Repository<Reward>,
        @InjectRepository(PlanReward)
        private readonly planRewardRepo: Repository<PlanReward>,
        @InjectRepository(WindowReward)
        private readonly windowRewardRepo: Repository<WindowReward>,
        @InjectRepository(Plan)
        private readonly planRepo: Repository<Plan>,
        @InjectRepository(ReferralWindow)
        private readonly windowRepo: Repository<ReferralWindow>,
    ) { }

    /**
     * Find linked rewards for a plan (Many-to-Many)
     */
    async getRewardsForPlan(planId: string): Promise<Reward[]> {
        const links = await this.planRewardRepo.find({
            where: { planId, isActive: true },
            relations: ['reward'],
        });

        // Filter out inactive rewards
        return links
            .map((link) => link.reward)
            .filter((reward) => reward.isActive && (reward.stock === null || reward.stock > 0));
    }

    /**
     * Get direct reward linked to plan (Many-to-One)
     */
    async getDirectPlanReward(planId: string): Promise<Reward | null> {
        const plan = await this.planRepo.findOne({
            where: { id: planId },
            relations: ['reward'],
        });

        if (plan && plan.reward && plan.reward.isActive) {
            return plan.reward;
        }
        return null;
    }

    /**
     * Find linked rewards for a referral window
     * Uses direct reward relationship (ManyToOne)
     */
    async getRewardsForWindow(windowId: string): Promise<Reward[]> {
        const window = await this.windowRepo.findOne({
            where: { id: windowId, isActive: true },
            relations: ['reward'],
        });

        if (!window || !window.reward || !window.reward.isActive) {
            return [];
        }

        // Check stock availability
        if (window.reward.stock !== null && window.reward.stock <= 0) {
            return [];
        }

        return [window.reward];
    }

    /**
     * Check stock and decrement if physical
     * Returns true if stock is available
     */
    async claimStock(rewardId: string, quantity: number = 1): Promise<boolean> {
        // Basic check-then-act for now; robust solution needs transaction or atomic update
        const reward = await this.rewardRepo.findOne({ where: { id: rewardId } });
        if (!reward || !reward.isActive) return false;

        if (reward.stock === null) return true; // Unlimited

        if (reward.stock < quantity) return false;

        // Determine lock is handled by caller or just optimistic
        await this.rewardRepo.decrement({ id: rewardId }, 'stock', quantity);
        return true;
    }

    // ==================== ADMIN CRUD METHODS ====================

    /**
     * Find all rewards with pagination and search
     */
    async findAll(pagination: any) {
        const where: any = { deleted: false };

        // Add search filter if provided
        if (pagination.search) {
            where.name = { $ilike: `%${pagination.search}%` } as any;
        }

        const queryBuilder = this.rewardRepo.createQueryBuilder('reward')
            .where('reward.deleted = :deleted', { deleted: false });

        if (pagination.search) {
            queryBuilder.andWhere('reward.name ILIKE :search', { search: `%${pagination.search}%` });
        }

        queryBuilder
            .orderBy('reward.createdAt', 'DESC')
            .skip(pagination.skip || 0)
            .take(pagination.take || 10);

        const [data, totalItems] = await queryBuilder.getManyAndCount();

        return {
            data,
            totalItems,
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            totalPages: Math.ceil(totalItems / (pagination.limit || 10)),
        };
    }

    /**
     * Find reward by ID
     */
    async findById(id: string): Promise<Reward | null> {
        return this.rewardRepo.findOne({
            where: { id, deleted: false },
        });
    }

    /**
     * Create new reward
     */
    async create(data: Partial<Reward>): Promise<Reward> {
        const reward = this.rewardRepo.create(data);
        return this.rewardRepo.save(reward);
    }

    /**
     * Update existing reward
     */
    async update(id: string, data: Partial<Reward>): Promise<Reward> {
        await this.rewardRepo.update(id, data);
        return this.findById(id) as Promise<Reward>;
    }

    /**
     * Soft delete reward
     */
    async softDelete(id: string): Promise<void> {
        await this.rewardRepo.update(id, { deleted: true, isActive: false });
    }

    /**
     * Link reward to a window
     */
    async linkToWindow(rewardId: string, windowId: string) {
        const existing = await this.windowRewardRepo.findOne({
            where: { rewardId, windowId },
        });

        if (existing) {
            existing.isActive = true;
            return this.windowRewardRepo.save(existing);
        }

        const link = this.windowRewardRepo.create({ rewardId, windowId, isActive: true });
        return this.windowRewardRepo.save(link);
    }

    /**
     * Link reward to a plan
     */
    async linkToPlan(rewardId: string, planId: string) {
        const existing = await this.planRewardRepo.findOne({
            where: { rewardId, planId },
        });

        if (existing) {
            existing.isActive = true;
            return this.planRewardRepo.save(existing);
        }

        const link = this.planRewardRepo.create({ rewardId, planId, isActive: true });
        return this.planRewardRepo.save(link);
    }

    /**
     * Get active rewards catalog for users
     */
    async getActiveCatalog(): Promise<Reward[]> {
        return this.rewardRepo.find({
            where: { isActive: true, deleted: false },
            order: { createdAt: 'DESC' },
        });
    }
}

