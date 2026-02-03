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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(WalletTransaction)
    private readonly walletTxRepo: Repository<WalletTransaction>,
  ) {}

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
    const result = await this.usersRepo
      .createQueryBuilder()
      .select('COUNT(DISTINCT cte."id")', 'count')
      .addCommonTableExpression(
        `
        WITH RECURSIVE referral_tree AS (
          -- Base case: direct referrals of the user
          SELECT "id", "referredBy", 1 as level
          FROM "users"
          WHERE "referredBy" = :userId AND "deletedAt" IS NULL
          
          UNION ALL
          
          -- Recursive case: referrals of referrals up to level 10
          SELECT "u"."id", "u"."referredBy", rt."level" + 1
          FROM "users" "u"
          INNER JOIN referral_tree rt ON "u"."referredBy" = rt."id"
          WHERE rt."level" < 10 AND "u"."deletedAt" IS NULL
        )
        SELECT * FROM referral_tree
        `,
        'cte',
      )
      .setParameter('userId', userId)
      .getRawOne();

    return parseInt(result?.count || '0', 10);
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
}
