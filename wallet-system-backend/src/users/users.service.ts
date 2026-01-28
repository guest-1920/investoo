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
