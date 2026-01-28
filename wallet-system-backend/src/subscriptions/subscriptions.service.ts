import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Subscription } from './subscription.entity';
import { WalletService } from '../wallet/wallet.service';
import { PlansService } from '../plans/plans.service';
import { UsersService } from '../users/users.service';
import { WalletTransactionSource } from '../wallet/enums/wallet.enums';
import { PaginationDto, PaginatedResponseDto } from '../common/dto';
import { SettingsService } from '../common/settings/settings.service';
import { SubscriptionPurchasedEvent } from '../common/events/domain-events';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly repo: Repository<Subscription>,
    private readonly walletService: WalletService,
    private readonly plansService: PlansService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly settingsService: SettingsService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  /**
   * Purchase a subscription plan
   * CRITICAL: Uses database transaction to ensure atomicity
   * - Creates new subscription (Multiple active subscriptions allowed)
   * - Debits wallet
   * - Creates new subscription
   * - Credits referrer if applicable
   */
  async purchase(userId: string, planId: string): Promise<Subscription> {
    // Load plan and user data upfront (outside transaction for read)
    const [plan, user] = await Promise.all([
      this.plansService.findById(planId),
      this.usersService.findById(userId),
    ]);

    if (!plan || plan.status !== 'ACTIVE') {
      throw new BadRequestException('Plan not available');
    }

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Execute everything in a single transaction
    const subscription = await this.dataSource.transaction(async (manager) => {
      const subscriptionRepo = manager.getRepository(Subscription);

      // 2. Debit wallet (with pessimistic locking inside)
      await this.walletService.debit(
        userId,
        Number(plan.price),
        WalletTransactionSource.PURCHASE,
        plan.id,
        manager,
      );

      // 3. Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + Number(plan.validity));

      // 4. Create new subscription
      const newSub = await subscriptionRepo.save(
        subscriptionRepo.create({
          userId,
          planId,
          startDate,
          endDate,
          isActive: true,
        }),
      );

      this.logger.log(`Subscription purchased`);

      // 5. Credit referral reward if applicable (Multi-level)
      if (user!.referredBy) {
        await this.distributeReferralRewards(
          user!.id,
          Number(plan!.price),
          newSub.id,
          manager,
        );
      }

      return newSub;
    });

    // START EVENT EMISSION
    try {
      this.eventEmitter.emit(
        'subscription.purchased',
        new SubscriptionPurchasedEvent({
          subscriptionId: subscription.id,
          userId,
          planId,
          planPrice: plan!.price,
          referrerId: user!.referredBy || undefined,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to emit subscription.purchased event for sub ${subscription.id}`,
        error.stack,
      );
    }
    // END EVENT EMISSION

    return subscription;
  }

  /**
   * Get user's active subscriptions
   */
  async getMySubscriptions(userId: string): Promise<Subscription[]> {
    return this.repo.find({
      where: { userId, isActive: true, deleted: false },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get user's subscription history
   */
  async getSubscriptionHistory(userId: string): Promise<Subscription[]> {
    return this.repo.find({
      where: { userId, deleted: false },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all subscriptions with pagination (Admin)
   */
  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Subscription>> {
    const filters = pagination.parsedFilters;

    // Handle isActive filter manually if it comes as string 'true'/'false'
    if (filters.isActive === 'true') filters.isActive = true;
    if (filters.isActive === 'false') filters.isActive = false;

    const [data, totalItems] = await this.repo.findAndCount({
      where: {
        deleted: false,
        ...filters,
      },
      relations: ['plan', 'user'],
      order: { [pagination.sortBy!]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.take,
    });

    return PaginatedResponseDto.create(
      data,
      totalItems,
      pagination.page!,
      pagination.limit!,
    );
  }

  /**
   * Distribute referral rewards based on multi-level configuration
   * Uses Recursive CTE to fetch ancestors efficiently in one query
   */
  private async distributeReferralRewards(
    userId: string,
    planAmount: number,
    subscriptionId: string,
    manager: EntityManager,
  ) {
    try {
      const settings = await this.settingsService.getReferralSettings();
      if (!settings.levels || settings.levels.length === 0) {
        return;
      }

      // 1. Fetch ancestors up to max level
      const maxLevel = settings.levels.length; // e.g., 3 levels

      // Recursive CTE to find ancestors
      const ancestors = await manager.query(
        `
        WITH RECURSIVE ancestry AS (
          -- Anchor member: immediate parent
          SELECT 
            "referredBy" as ancestor_id, 
            1 as level,
            ARRAY[id::text] as visited -- Track visited path to prevent cycles
          FROM users
          WHERE id = $1 AND "referredBy" IS NOT NULL
          
          UNION ALL
          
          -- Recursive member: parent of parent
          SELECT 
            u."referredBy", 
            a.level + 1,
            a.visited || u.id::text
          FROM users u
          INNER JOIN ancestry a ON u.id = a.ancestor_id
          WHERE 
            u."referredBy" IS NOT NULL 
            AND a.level < $2
            AND NOT (u."referredBy"::text = ANY(a.visited)) -- Cycle detection
        )
        SELECT ancestor_id, level FROM ancestry;
        `,
        [userId, maxLevel],
      );

      // 2. Calculate rewards in memory
      const batchItems: {
        userId: string;
        amount: number;
        source: WalletTransactionSource;
        referenceId?: string;
      }[] = [];

      for (const ancestor of ancestors) {
        const levelConfig = settings.levels.find(
          (l) => l.level === ancestor.level,
        );
        if (levelConfig && levelConfig.percentage > 0) {
          const rewardAmount = (planAmount * levelConfig.percentage) / 100;

          if (rewardAmount > 0) {
            batchItems.push({
              userId: ancestor.ancestor_id,
              amount: rewardAmount,
              source: WalletTransactionSource.REFERRAL_BONUS,
              referenceId: subscriptionId,
            });
          }
        }
      }

      // 3. Execute batch credit if there are any rewards
      if (batchItems.length > 0) {
        await this.walletService.batchCredit(batchItems, manager);
        this.logger.log(
          `Referral rewards distributed: ${batchItems.length} beneficiaries triggered by userId=${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to distribute referral rewards for user ${userId}`,
        error.stack,
      );
      // Non-blocking error for purchase flow, but should be alerted
    }
  }
}
