import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan, EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Subscription } from './subscription.entity';
import { DailyReturnLog } from './daily-return-log.entity';
import { DailyReturnSummary } from './daily-return-summary.entity';
import { PeriodType } from './enums';
import { Plan } from '../plans/plan.entity';
import { WalletService } from '../wallet/wallet.service';
import { WalletTransactionSource } from '../wallet/enums/wallet.enums';

@Injectable()
export class DailyReturnsService {
  private readonly logger = new Logger(DailyReturnsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(DailyReturnLog)
    private readonly dailyReturnLogRepo: Repository<DailyReturnLog>,
    @InjectRepository(DailyReturnSummary)
    private readonly summaryRepo: Repository<DailyReturnSummary>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Cron job to credit daily returns to all active subscribers
   * Runs daily at 1:00 AM (configurable via DAILY_RETURNS_CRON env var)
   */
  @Cron(process.env.DAILY_RETURNS_CRON || '0 1 * * *')
  async processDailyReturns() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.logger.log(
      `Starting daily returns processing for ${today.toISOString().split('T')[0]}`,
    );

    try {
      // Find all active subscriptions that haven't expired
      const activeSubscriptions = await this.subscriptionRepo.find({
        where: {
          isActive: true,
          endDate: MoreThan(today),
          deleted: false,
        },
      });

      if (activeSubscriptions.length === 0) {
        this.logger.log('No active subscriptions found');
        return;
      }

      this.logger.log(
        `Found ${activeSubscriptions.length} active subscriptions`,
      );

      let creditedCount = 0;
      let skippedCount = 0;
      let totalAmount = 0;

      for (const subscription of activeSubscriptions) {
        try {
          const credited = await this.creditDailyReturn(subscription, today);
          if (credited) {
            creditedCount++;
            totalAmount += credited;
          } else {
            skippedCount++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to credit daily return for subscription ${subscription.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Daily returns complete: credited=${creditedCount}, skipped=${skippedCount}, totalAmount=${totalAmount}`,
      );
    } catch (error) {
      this.logger.error(`Daily returns processing failed: ${error.message}`);
    }
  }

  /**
   * Credit daily return for a single subscription
   * Returns the amount credited, or 0 if skipped
   */
  private async creditDailyReturn(
    subscription: Subscription,
    date: Date,
  ): Promise<number> {
    // Check if already credited for this date
    const existing = await this.dailyReturnLogRepo.findOne({
      where: {
        subscriptionId: subscription.id,
        creditedForDate: date,
      },
    });

    if (existing) {
      return 0; // Already credited
    }

    // Load the plan to get daily return amount
    const plan = await this.planRepo.findOne({
      where: { id: subscription.planId, deleted: false },
    });

    if (!plan || plan.dailyReturn <= 0) {
      return 0; // No daily return configured
    }

    // Credit in a transaction
    return this.dataSource.transaction(async (manager) => {
      // Credit wallet
      const walletTx = await this.walletService.credit(
        subscription.userId,
        plan.dailyReturn,
        WalletTransactionSource.DAILY_RETURN,
        subscription.id,
        manager,
      );

      // Log the credit
      const log = this.dailyReturnLogRepo.create({
        subscriptionId: subscription.id,
        userId: subscription.userId,
        planId: subscription.planId,
        amount: plan.dailyReturn,
        creditedForDate: date,
        walletTransactionId: walletTx.id,
      });

      await manager.save(log);

      // Update pre-aggregated summaries
      await this.updateSummaries(
        subscription.userId,
        date,
        plan.dailyReturn,
        manager,
      );

      this.logger.debug(
        `Credited ${plan.dailyReturn} to user ${subscription.userId} for subscription ${subscription.id}`,
      );

      return plan.dailyReturn;
    });
  }

  /**
   * Update pre-aggregated summaries for a user when a daily return is credited
   */
  private async updateSummaries(
    userId: string,
    date: Date,
    amount: number,
    manager: EntityManager,
  ): Promise<void> {
    const periodTypes: PeriodType[] = [
      PeriodType.DAY,
      PeriodType.WEEK,
      PeriodType.MONTH,
    ];

    for (const periodType of periodTypes) {
      const periodKey = this.getPeriodKey(date, periodType);

      // Upsert: increment if exists, insert if not
      await manager.query(
        `
                INSERT INTO daily_return_summary ("id", "userId", "periodType", "periodKey", "totalAmount", "count", "createdAt", "updatedAt", "deleted")
                VALUES (gen_random_uuid(), $1, $2, $3, $4, 1, NOW(), NOW(), false)
                ON CONFLICT ("userId", "periodType", "periodKey")
                DO UPDATE SET 
                    "totalAmount" = daily_return_summary."totalAmount" + $4,
                    "count" = daily_return_summary."count" + 1,
                    "updatedAt" = NOW()
                `,
        [userId, periodType, periodKey, amount],
      );
    }
  }

  /**
   * Get period key string for a given date and period type
   */
  private getPeriodKey(date: Date, periodType: PeriodType): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (periodType) {
      case PeriodType.DAY:
        return `${year}-${month}-${day}`;
      case PeriodType.WEEK:
        // ISO week number
        const weekNum = this.getISOWeekNumber(date);
        return `${year}-W${String(weekNum).padStart(2, '0')}`;
      case PeriodType.MONTH:
        return `${year}-${month}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * Get ISO week number for a date
   */
  private getISOWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Manually trigger daily returns (for testing/admin use)
   */
  async triggerManually(): Promise<{ credited: number; total: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeSubscriptions = await this.subscriptionRepo.find({
      where: {
        isActive: true,
        endDate: MoreThan(today),
        deleted: false,
      },
    });

    let credited = 0;
    let total = 0;

    for (const subscription of activeSubscriptions) {
      const amount = await this.creditDailyReturn(subscription, today);
      if (amount > 0) {
        credited++;
        total += amount;
      }
    }

    return { credited, total };
  }

  /**
   * Get daily return logs for a user with optional filtering and aggregation
   * @param userId - User ID
   * @param since - Optional, ISO date string to filter from
   * @param groupBy - Optional, 'day' | 'week' | 'month' for aggregation
   */
  async getMyDailyReturns(
    userId: string,
    since?: string,
    groupBy?: PeriodType,
  ): Promise<{ data: any[]; summary: { totalProfit: number; count: number } }> {
    // If groupBy is specified, use pre-aggregated summary table (fast path)
    if (groupBy) {
      return this.getFromSummaryTable(userId, since, groupBy);
    }

    // No aggregation: return raw data from daily_return_logs
    const queryBuilder = this.dailyReturnLogRepo.createQueryBuilder('log');
    queryBuilder.where('log.userId = :userId', { userId });
    queryBuilder.andWhere('log.deleted = false');

    if (since) {
      queryBuilder.andWhere('log.creditedForDate >= :since', {
        since: new Date(since),
      });
    }

    queryBuilder.orderBy('log.creditedForDate', 'ASC');
    const data = await queryBuilder.getMany();
    const totalProfit = data.reduce((acc, log) => acc + Number(log.amount), 0);

    return {
      data: data.map((log) => ({
        createdAt: log.creditedForDate,
        amount: Number(log.amount),
      })),
      summary: { totalProfit, count: data.length },
    };
  }

  /**
   * Query pre-aggregated summary table for fast graph data retrieval
   */
  private async getFromSummaryTable(
    userId: string,
    since: string | undefined,
    periodType: PeriodType,
  ): Promise<{ data: any[]; summary: { totalProfit: number; count: number } }> {
    const queryBuilder = this.summaryRepo.createQueryBuilder('s');
    queryBuilder.where('s.userId = :userId', { userId });
    queryBuilder.andWhere('s.periodType = :periodType', { periodType });
    queryBuilder.andWhere('s.deleted = false');

    if (since) {
      // Filter based on periodKey (works for day format like '2026-01-20')
      const sinceKey = this.getPeriodKey(new Date(since), periodType);
      queryBuilder.andWhere('s.periodKey >= :sinceKey', { sinceKey });
    }

    queryBuilder.orderBy('s.periodKey', 'ASC');
    const summaries = await queryBuilder.getMany();

    const totalProfit = summaries.reduce(
      (acc, s) => acc + Number(s.totalAmount),
      0,
    );
    const totalCount = summaries.reduce((acc, s) => acc + s.count, 0);

    // Convert periodKey to date format expected by frontend
    const data = summaries.map((s) => ({
      createdAt: this.periodKeyToDate(s.periodKey, periodType),
      amount: Number(s.totalAmount),
      count: s.count,
    }));

    return {
      data,
      summary: { totalProfit, count: totalCount },
    };
  }

  /**
   * Convert periodKey back to a date string for frontend consumption
   */
  private periodKeyToDate(periodKey: string, periodType: PeriodType): string {
    switch (periodType) {
      case PeriodType.DAY:
        // Already in YYYY-MM-DD format
        return periodKey;
      case PeriodType.WEEK:
        // Format: '2026-W03' -> return first day of that week
        const [year, weekPart] = periodKey.split('-W');
        const weekNum = parseInt(weekPart, 10);
        const jan1 = new Date(Date.UTC(parseInt(year, 10), 0, 1));
        const daysOffset = (weekNum - 1) * 7 - (jan1.getUTCDay() || 7) + 1;
        const weekStart = new Date(jan1.getTime() + daysOffset * 86400000);
        return weekStart.toISOString().split('T')[0];
      case PeriodType.MONTH:
        // Format: '2026-01' -> '2026-01-01'
        return `${periodKey}-01`;
      default:
        return periodKey;
    }
  }

  /**
   * Rebuild all summaries from daily_return_logs (for initial population or repair)
   * This should be run once after migration to populate summaries from existing data
   */
  async rebuildSummaries(): Promise<{ processed: number; upserted: number }> {
    this.logger.log('Starting summary rebuild from daily_return_logs...');

    // Get all logs grouped by user and date
    const allLogs = await this.dailyReturnLogRepo.find({
      where: { deleted: false },
      order: { creditedForDate: 'ASC' },
    });

    // Clear existing summaries
    await this.summaryRepo.update({}, { deleted: true });

    let upserted = 0;

    for (const log of allLogs) {
      const periodTypes: PeriodType[] = [
        PeriodType.DAY,
        PeriodType.WEEK,
        PeriodType.MONTH,
      ];

      for (const periodType of periodTypes) {
        const periodKey = this.getPeriodKey(log.creditedForDate, periodType);

        await this.dataSource.query(
          `
                    INSERT INTO daily_return_summary ("id", "userId", "periodType", "periodKey", "totalAmount", "count", "createdAt", "updatedAt", "deleted")
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, 1, NOW(), NOW(), false)
                    ON CONFLICT ("userId", "periodType", "periodKey")
                    DO UPDATE SET 
                        "totalAmount" = daily_return_summary."totalAmount" + $4,
                        "count" = daily_return_summary."count" + 1,
                        "updatedAt" = NOW(),
                        "deleted" = false
                    `,
          [log.userId, periodType, periodKey, log.amount],
        );
        upserted++;
      }
    }

    this.logger.log(
      `Summary rebuild complete: processed=${allLogs.length} logs, upserted=${upserted} summaries`,
    );
    return { processed: allLogs.length, upserted };
  }

  /**
   * Get all daily return logs with pagination (Admin)
   */
  async findAllLogs(
    page = 1,
    limit = 10,
  ): Promise<{
    data: DailyReturnLog[];
    meta: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const [data, totalItems] = await this.dailyReturnLogRepo.findAndCount({
      where: { deleted: false },
      relations: ['user', 'plan', 'subscription'],
      order: { creditedForDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
