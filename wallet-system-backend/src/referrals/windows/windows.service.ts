import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReferralWindow } from './entities/referral-window.entity';
import {
    ReferralWindowProgress,
    ReferralWindowProgressStatus,
} from './entities/referral-window-progress.entity';
import {
    ReferralQualifiedEvent,
    WindowProgressCompletedEvent,
    WindowProgressExpiredEvent,
} from '../../common/events/domain-events';

@Injectable()
export class ReferralWindowService {
    private readonly logger = new Logger(ReferralWindowService.name);

    constructor(
        @InjectRepository(ReferralWindow)
        private windowRepo: Repository<ReferralWindow>,
        @InjectRepository(ReferralWindowProgress)
        private progressRepo: Repository<ReferralWindowProgress>,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    /**
     * Process a qualified referral event.
     * Logic:
     * 1. Find all active global windows.
     * 2. For each window, check if the referee's purchase amount >= window's minPurchaseAmount.
     * 3. If qualified, find or create progress for the referrer.
     * 4. Update progress (increment count).
     * 5. Check if window target is met.
     */
    async processQualifiedReferral(data: {
        referrerId: string;
        refereeId: string;
        subscriptionId: string;
        planPrice: number;
    }) {
        const { referrerId, refereeId, planPrice } = data;
        this.logger.log(`Processing referral for referrer ${referrerId}, price: ${planPrice}`);

        // 1. Fetch active windows
        // TODO: optimization - cache this
        const activeWindows = await this.windowRepo.find({
            where: { isActive: true },
        });

        if (!activeWindows.length) {
            this.logger.debug('No active referral windows found.');
            return;
        }

        for (const window of activeWindows) {
            // 2. Check purchase requirement
            if (planPrice < window.minPurchaseAmount) {
                this.logger.debug(
                    `Plan price ${planPrice} below window ${window.name} min ${window.minPurchaseAmount}`,
                );
                continue;
            }

            // 3. Find or Create Progress
            let progress = await this.getOrCreateProgress(referrerId, window);

            // If progress is already completed or expired, logic might vary.
            // - If Expired: logic is to RESTART automatically on next referral (from requirements)
            // - If Completed: typically they are done, unless we allow looping (stacking/tiering).
            //   The requirement "Window restarts automatically... if previous window expired" implies looping on expiry.
            //   Multi-tier reward logic "Upgrade Logic" suggests one active progress at a time? or just one window ID?

            // Handle Expiry check first
            if (progress.status === ReferralWindowProgressStatus.IN_PROGRESS && new Date() > progress.windowEnd) {
                // Mark as expired
                progress.status = ReferralWindowProgressStatus.EXPIRED;
                await this.progressRepo.save(progress);

                this.eventEmitter.emit('window.progress.expired', new WindowProgressExpiredEvent({
                    progressId: progress.id,
                    userId: referrerId,
                    windowId: window.id
                }));

                // Requirements say: "Restarts automatically on the next referral if the previous window expired."
                // So we create a NEW progress record now.
                progress = await this.createProgress(referrerId, window);
            }

            if (progress.status !== ReferralWindowProgressStatus.IN_PROGRESS) {
                // If completed or claimed or expired (and not restarted), skip
                this.logger.debug(`Skipping window ${window.id}: Status ${progress.status}`);
                continue;
            }

            // 4. Update Progress
            progress.qualifiedReferrals += 1;
            await this.progressRepo.save(progress);

            this.logger.log(`Referrer ${referrerId} progress on ${window.name}: ${progress.qualifiedReferrals}/${window.targetReferralCount}`);

            this.eventEmitter.emit(
                'referral.qualified',
                new ReferralQualifiedEvent({
                    referrerId,
                    refereeId,
                    subscriptionId: data.subscriptionId,
                    windowId: window.id,
                    progressId: progress.id,
                    newCount: progress.qualifiedReferrals,
                    targetCount: window.targetReferralCount,
                }),
            );

            // 5. Completion Check
            if (progress.qualifiedReferrals >= window.targetReferralCount) {
                await this.completeWindow(progress, window);
            }
        }
    }

    private async getOrCreateProgress(userId: string, window: ReferralWindow): Promise<ReferralWindowProgress> {
        // Bug #8 Fix: We need to find the latest *active* progress.
        // If a previous window expired, we want to create a NEW one.
        // So we filter by status: IN_PROGRESS.
        const progress = await this.progressRepo.findOne({
            where: {
                userId,
                windowId: window.id,
                status: ReferralWindowProgressStatus.IN_PROGRESS
            },
            order: { createdAt: 'DESC' },
        });

        // If no active progress found (either first time or previous expired), create new.
        if (!progress) {
            return this.createProgress(userId, window);
        }

        return progress;
    }

    private async createProgress(userId: string, window: ReferralWindow): Promise<ReferralWindowProgress> {
        const now = new Date();
        const end = new Date();
        end.setDate(now.getDate() + window.windowDurationDays);

        const newProgress = this.progressRepo.create({
            userId,
            windowId: window.id,
            windowStart: now,
            windowEnd: end,
            qualifiedReferrals: 0,
            status: ReferralWindowProgressStatus.IN_PROGRESS,
        });

        return this.progressRepo.save(newProgress);
    }

    private async completeWindow(progress: ReferralWindowProgress, window: ReferralWindow) {
        progress.status = ReferralWindowProgressStatus.COMPLETED;
        progress.completedAt = new Date();
        await this.progressRepo.save(progress);

        this.logger.log(`Window completed: ${progress.id} by user ${progress.userId}`);

        // Emit completion event to trigger rewards
        // We need to fetch linked rewards for this window to pass IDs? 
        // Or let the listener handle it? The Event payload asks for rewardIds.
        // It's better if the listener or RewardService decides WHAT reward to give, 
        // but here we know the window is done.
        // Let's modify the event to NOT strict rewardIds if the listener fetches them.
        // But for now, we'll keep the payload structure.

        this.eventEmitter.emit(
            'window.progress.completed',
            new WindowProgressCompletedEvent({
                progressId: progress.id,
                userId: progress.userId,
                windowId: window.id,
                rewardIds: [], // Listener should resolve this from Window ID
            }),
        );
    }

    // ==================== ADMIN CRUD METHODS ====================

    /**
     * Find all windows with pagination
     */
    async findAll(pagination: any) {
        const [data, totalItems] = await this.windowRepo.findAndCount({
            where: { deleted: false },
            relations: ['reward'],
            order: { createdAt: 'DESC' },
            skip: pagination.skip || 0,
            take: pagination.take || 10,
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
     * Find window by ID
     */
    async findById(id: string): Promise<ReferralWindow | null> {
        return this.windowRepo.findOne({
            where: { id, deleted: false },
            relations: ['reward'],
        });
    }

    /**
     * Create new window
     */
    async create(data: Partial<ReferralWindow>): Promise<ReferralWindow> {
        const window = this.windowRepo.create(data);
        return this.windowRepo.save(window);
    }

    /**
     * Update existing window
     */
    async update(id: string, data: Partial<ReferralWindow>): Promise<ReferralWindow> {
        await this.windowRepo.update(id, data);
        return this.findById(id) as Promise<ReferralWindow>;
    }

    /**
     * Activate or deactivate window
     */
    async setActive(id: string, isActive: boolean): Promise<ReferralWindow> {
        await this.windowRepo.update(id, { isActive });
        return this.findById(id) as Promise<ReferralWindow>;
    }

    /**
     * Soft delete window
     */
    async softDelete(id: string): Promise<void> {
        await this.windowRepo.update(id, { deleted: true, isActive: false });
    }

    // ==================== USER METHODS ====================

    /**
     * Get all active windows
     */
    async getActiveWindows(): Promise<ReferralWindow[]> {
        return this.windowRepo.find({
            where: { isActive: true, deleted: false },
            relations: ['reward'],
        });
    }

    /**
     * Get user's progress on all active windows
     */
    async getUserProgress(userId: string) {
        const activeWindows = await this.getActiveWindows();

        const progressList = await Promise.all(
            activeWindows.map(async (window) => {
                const progress = await this.progressRepo.findOne({
                    where: { userId, windowId: window.id },
                    order: { createdAt: 'DESC' },
                });

                return {
                    window: {
                        id: window.id,
                        name: window.name,
                        targetReferralCount: window.targetReferralCount,
                        windowDurationDays: window.windowDurationDays,
                        minPurchaseAmount: window.minPurchaseAmount,
                    },
                    progress: progress ? {
                        id: progress.id,
                        qualifiedReferrals: progress.qualifiedReferrals,
                        status: progress.status,
                        windowStart: progress.windowStart,
                        windowEnd: progress.windowEnd,
                        completedAt: progress.completedAt,
                    } : null,
                };
            })
        );

        return progressList;
    }
}

