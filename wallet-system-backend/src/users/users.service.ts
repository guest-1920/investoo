import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../common/enums/roles.enum';
import { WalletTransaction } from '../wallet/wallet-transaction.entity';
import {
  WalletTransactionSource,
  WalletTransactionType,
  WalletTransactionStatus,
} from '../wallet/enums/wallet.enums';
import { SettingsService } from '../common/settings/settings.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(WalletTransaction)
    private readonly walletTxRepo: Repository<WalletTransaction>,
    private readonly settingsService: SettingsService,
  ) { }

  /**
   * Find user by email (case-insensitive)
   */
  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return this.usersRepo.findOne({
      where: { email: normalizedEmail, deleted: false },
    });
  }

  /**
   * Find user by email with password (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return this.usersRepo.findOne({
      where: { email: normalizedEmail, deleted: false },
      select: ['id', 'email', 'password', 'role', 'name'],
    });
  }

  /**
   * Find user by referral code
   */
  async findByReferralCode(code: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { referralCode: code, deleted: false },
    });
  }

  /**
   * Create a new user
   */
  async create(data: Partial<User>): Promise<User> {
    // Ensure email is normalized
    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { id, deleted: false },
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<User>): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;

    Object.assign(user, data);
    return this.usersRepo.save(user);
  }

  /**
   * Get all non-admin users with pagination (Admin dashboard)
   * Only shows regular users, not other admins
   */
  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{
    data: User[];
    meta: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const [data, totalItems] = await this.usersRepo.findAndCount({
      where: {
        deleted: false,
        role: Role.USER, // Only show regular users, not admins
      },
      order: { createdAt: 'DESC' },
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

  /**
   * Count direct referrals (level 1 only)
   * Only counts users directly referred by this user
   */
  async countDirectReferrals(userId: string): Promise<number> {
    return this.usersRepo.count({
      where: { referredBy: userId, deleted: false },
    });
  }

  /**
   * Count total referrals up to 10 levels using recursive CTE
   * User is at level 0, direct referrals are level 1, their referrals are level 2, etc.
   */
  async countTotalReferrals(userId: string): Promise<number> {
    const result = await this.usersRepo.query(
      `
      WITH RECURSIVE referral_tree AS (
        -- Base case: direct referrals of the user
        SELECT "id", "referredBy", 1 as level
        FROM "users"
        WHERE "referredBy" = $1 AND "deletedAt" IS NULL
        
        UNION ALL
        
        -- Recursive case: referrals of referrals up to level 10
        SELECT "u"."id", "u"."referredBy", rt."level" + 1
        FROM "users" "u"
        INNER JOIN referral_tree rt ON "u"."referredBy" = rt."id"
        WHERE rt."level" < 10 AND "u"."deletedAt" IS NULL
      )
      SELECT COUNT(DISTINCT "id") as "count" FROM referral_tree
      `,
      [userId],
    );

    return parseInt(result?.[0]?.count || '0', 10);
  }

  /**
   * Get referral statistics for a user
   * Returns total earnings from referral bonuses, active referral count, and commission history
   */
  async getReferralStats(userId: string): Promise<{
    totalEarnings: number;
    activeReferrals: number;
    commissionHistory: Array<{
      id: string;
      amount: number;
      createdAt: Date;
      referredUserName: string;
    }>;
  }> {
    // Count users referred by this user
    const activeReferrals = await this.usersRepo.count({
      where: { referredBy: userId, deleted: false },
    });

    // Get total earnings from REFERRAL_BONUS transactions
    const earningsResult = await this.walletTxRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.amount), 0)', 'total')
      .where('tx.userId = :userId', { userId })
      .andWhere('tx.source = :source', {
        source: WalletTransactionSource.REFERRAL_BONUS,
      })
      .andWhere('tx.type = :type', { type: WalletTransactionType.CREDIT })
      .andWhere('tx.status = :status', {
        status: WalletTransactionStatus.SUCCESS,
      })
      .getRawOne();

    const totalEarnings = parseFloat(earningsResult?.total || '0');

    // Get recent commission history with referred user info
    const recentTransactions = await this.walletTxRepo.find({
      where: {
        userId,
        source: WalletTransactionSource.REFERRAL_BONUS,
        type: WalletTransactionType.CREDIT,
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // For each transaction, try to find the referred user by referenceId
    const commissionHistory = await Promise.all(
      recentTransactions.map(async (tx) => {
        let referredUserName = 'Unknown User';
        if (tx.referenceId) {
          const referredUser = await this.usersRepo.findOne({
            where: { id: tx.referenceId },
            select: ['name'],
          });
          if (referredUser) {
            referredUserName = referredUser.name;
          }
        }
        return {
          id: tx.id,
          amount: tx.amount,
          createdAt: tx.createdAt,
          referredUserName,
        };
      }),
    );

    return {
      totalEarnings,
      activeReferrals,
      commissionHistory,
    };
  }
  /**
   * Get referral tree data for visualization
   * Returns all referrals with calculated bonus based on level percentages and plans bought
   */
  async getReferralTree(userId: string): Promise<{
    referrals: Array<{
      id: string;
      name: string;
      referredBy: string;
      referredByName: string;
      bonus: number;
      joinedDate: Date;
      level: number;
      plansBought: number;
      totalPlanValue: number;
    }>;
    totalBonus: number;
    levelPercentages: Array<{ level: number; percentage: number }>;
  }> {
    // Get referral settings for level percentages
    const referralSettings = await this.settingsService.getReferralSettings();
    const levelPercentages = referralSettings.levels || [];

    // Use recursive CTE to get all referrals up to 10 levels with their level info
    const referralsWithLevel = await this.usersRepo.query(
      `
      WITH RECURSIVE referral_tree AS (
        -- Base case: direct referrals of the user (level 1)
        SELECT 
          "id", 
          "name", 
          "referredBy",
          "createdAt",
          1 as level
        FROM "users"
        WHERE "referredBy" = $1 AND "deletedAt" IS NULL
        
        UNION ALL
        
        -- Recursive case: referrals of referrals up to level 10
        SELECT 
          "u"."id", 
          "u"."name", 
          "u"."referredBy",
          "u"."createdAt",
          rt."level" + 1
        FROM "users" "u"
        INNER JOIN referral_tree rt ON "u"."referredBy" = rt."id"
        WHERE rt."level" < 10 AND "u"."deletedAt" IS NULL
      )
      SELECT * FROM referral_tree ORDER BY level, "createdAt" DESC
      `,
      [userId],
    );

    // Get the current user's name for "Direct" referrals
    const currentUser = await this.findById(userId);
    const currentUserName = currentUser?.name || 'You';

    // Build a map of user IDs to names for referrer lookup
    const userNames = new Map<string, string>();
    userNames.set(userId, currentUserName);

    referralsWithLevel.forEach((ref: any) => {
      userNames.set(ref.id, ref.name);
    });

    const referralIds = referralsWithLevel.map((r: any) => r.id);

    // Get subscription data with plan prices for each referral user
    const subscriptionData = await this.usersRepo.query(
      `
      SELECT 
        s."userId",
        COUNT(*) as "planCount",
        COALESCE(SUM(p."price"), 0) as "totalPlanValue"
      FROM "subscriptions" s
      INNER JOIN "plans" p ON p."id" = s."planId"
      WHERE s."userId" = ANY($1) AND s."deletedAt" IS NULL
      GROUP BY s."userId"
      `,
      [referralIds.length > 0 ? referralIds : ['00000000-0000-0000-0000-000000000000']],
    );

    const planCountMap = new Map<string, number>();
    const planValueMap = new Map<string, number>();
    subscriptionData.forEach((data: any) => {
      planCountMap.set(data.userId, parseInt(data.planCount, 10));
      planValueMap.set(data.userId, parseFloat(data.totalPlanValue || '0'));
    });

    // Build the referral tree data with calculated bonus
    const referrals = referralsWithLevel.map((ref: any) => {
      const totalPlanValue = planValueMap.get(ref.id) || 0;
      const level = ref.level;

      // Find the percentage for this level
      const levelConfig = levelPercentages.find((l) => l.level === level);
      const percentage = levelConfig?.percentage || 0;

      // Calculate bonus: (totalPlanValue * percentage) / 100
      const bonus = (totalPlanValue * percentage) / 100;

      return {
        id: ref.id,
        name: ref.name,
        referredBy: ref.referredBy,
        referredByName: userNames.get(ref.referredBy) || 'Unknown',
        bonus: Math.round(bonus * 100) / 100, // Round to 2 decimal places
        joinedDate: ref.createdAt,
        level: level,
        plansBought: planCountMap.get(ref.id) || 0,
        totalPlanValue: totalPlanValue,
      };
    });

    // Calculate total bonus
    const totalBonus = referrals.reduce((sum: number, ref: any) => sum + ref.bonus, 0);

    return {
      referrals,
      totalBonus,
      levelPercentages,
    };
  }
}