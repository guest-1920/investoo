import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { WalletTransaction } from './wallet-transaction.entity';
import {
  WalletTransactionType,
  WalletTransactionSource,
  WalletTransactionStatus,
} from './enums/wallet.enums';
import { PaginationDto, PaginatedResponseDto } from '../common/dto';
import { User } from '../users/user.entity';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(WalletTransaction)
    private readonly repo: Repository<WalletTransaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Credit amount to user's wallet (within transaction if manager provided)
   * Updates both WalletTransaction and User.walletBalance
   */
  async credit(
    userId: string,
    amount: number,
    source: WalletTransactionSource,
    referenceId?: string,
    manager?: EntityManager,
  ): Promise<WalletTransaction> {
    // If manager provided, use it directly
    if (manager) {
      return this.performCredit(userId, amount, source, referenceId, manager);
    }

    // Otherwise, create a new transaction
    return this.dataSource.transaction(async (txManager) => {
      return this.performCredit(userId, amount, source, referenceId, txManager);
    });
  }

  /**
   * Internal method to perform credit within a transaction
   */
  private async performCredit(
    userId: string,
    amount: number,
    source: WalletTransactionSource,
    referenceId: string | undefined,
    manager: EntityManager,
  ): Promise<WalletTransaction> {
    const txRepo = manager.getRepository(WalletTransaction);
    const userRepo = manager.getRepository(User);

    // Create wallet transaction
    const tx = txRepo.create({
      userId,
      amount,
      type: WalletTransactionType.CREDIT,
      source,
      referenceId,
      status: WalletTransactionStatus.SUCCESS,
    });

    // Update user's wallet balance
    await userRepo.increment({ id: userId }, 'walletBalance', amount);

    this.logger.log(
      `CREDIT: userId=${userId}, amount=${amount}, source=${source}`,
    );
    return txRepo.save(tx);
  }

  /**
   * Batch credit multiple users at once
   * Optimized to use minimal database queries (1 update + 1 insert)
   */
  async batchCredit(
    items: {
      userId: string;
      amount: number;
      source: WalletTransactionSource;
      referenceId?: string;
    }[],
    manager?: EntityManager,
  ): Promise<void> {
    if (items.length === 0) return;

    if (manager) {
      return this.performBatchCredit(items, manager);
    }

    return this.dataSource.transaction(async (txManager) => {
      return this.performBatchCredit(items, txManager);
    });
  }

  private async performBatchCredit(
    items: {
      userId: string;
      amount: number;
      source: WalletTransactionSource;
      referenceId?: string;
    }[],
    manager: EntityManager,
  ): Promise<void> {
    const txRepo = manager.getRepository(WalletTransaction);

    // 1. Bulk Insert Wallet Transactions
    // We construct entities to let TypeORM handle default values
    const transactions = items.map((item) =>
      txRepo.create({
        userId: item.userId,
        amount: item.amount,
        type: WalletTransactionType.CREDIT,
        source: item.source,
        referenceId: item.referenceId,
        status: WalletTransactionStatus.SUCCESS,
      }),
    );

    await txRepo.save(transactions);

    // 2. Bulk Update User Balances
    // Construct a VALUES list for the SQL update
    // Format: ('uuid', amount), ('uuid', amount)
    const values = items
      .map((item) => `('${item.userId}', ${item.amount})`)
      .join(', ');

    // Execute raw query for efficiency
    // Note: Casting amount to numeric to match column type if needed,
    // but typically Postgres handles number -> numeric auto-cast or we can be explicit.
    // Assuming id is uuid.
    await manager.query(`
      UPDATE users AS u
      SET "walletBalance" = u."walletBalance" + v.amount
      FROM (VALUES ${values}) AS v(id, amount)
      WHERE u.id = v.id::uuid
    `);

    this.logger.log(`BATCH CREDIT: Processed ${items.length} items`);
  }

  /**
   * Debit amount from user's wallet with pessimistic locking
   * CRITICAL: Uses database transaction to prevent race conditions
   */
  async debit(
    userId: string,
    amount: number,
    source: WalletTransactionSource,
    referenceId?: string,
    manager?: EntityManager,
  ): Promise<WalletTransaction> {
    // If manager provided, use it directly (we're already in a transaction)
    if (manager) {
      return this.performDebit(userId, amount, source, referenceId, manager);
    }

    // Otherwise, create a new transaction with pessimistic locking
    return this.dataSource.transaction(async (txManager) => {
      return this.performDebit(userId, amount, source, referenceId, txManager);
    });
  }

  /**
   * Internal method to perform debit within a transaction
   * Uses pessimistic locking on User row to prevent race conditions
   */
  private async performDebit(
    userId: string,
    amount: number,
    source: WalletTransactionSource,
    referenceId: string | undefined,
    manager: EntityManager,
  ): Promise<WalletTransaction> {
    const userRepo = manager.getRepository(User);
    const txRepo = manager.getRepository(WalletTransaction);

    // Lock user row and get current balance
    const user = await userRepo
      .createQueryBuilder('user')
      .setLock('pessimistic_write')
      .where('user.id = :userId', { userId })
      .andWhere('user.deleted = false')
      .getOne();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const balance = Number(user.walletBalance);

    if (balance < amount) {
      this.logger.warn(
        `DEBIT FAILED: userId=${userId}, requested=${amount}, available=${balance}`,
      );
      throw new BadRequestException(
        `Insufficient balance. Available: ${balance}, Requested: ${amount}`,
      );
    }

    // Validate balance won't go negative
    const newBalance = balance - amount;
    if (newBalance < 0) {
      throw new BadRequestException('Wallet balance cannot go negative');
    }

    // Create wallet transaction
    const tx = txRepo.create({
      userId,
      amount,
      type: WalletTransactionType.DEBIT,
      source,
      referenceId,
      status: WalletTransactionStatus.SUCCESS,
    });

    // Update user's wallet balance
    await userRepo.decrement({ id: userId }, 'walletBalance', amount);

    this.logger.log(
      `DEBIT: userId=${userId}, amount=${amount}, source=${source}`,
    );
    return txRepo.save(tx);
  }

  /**
   * Get current balance from User table (fast O(1) lookup)
   */
  async getBalance(userId: string): Promise<number> {
    const user = await this.userRepo.findOne({
      where: { id: userId, deleted: false },
      select: ['walletBalance'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return Number(user.walletBalance);
  }

  /**
   * Get pending withdrawal amount (reserved but not yet processed)
   */
  async getPendingWithdrawals(userId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.amount), 0)', 'pending')
      .where('tx.userId = :userId', { userId })
      .andWhere('tx.type = :type', { type: WalletTransactionType.DEBIT })
      .andWhere('tx.source = :source', {
        source: WalletTransactionSource.WITHDRAW,
      })
      .andWhere('tx.status = :status', {
        status: WalletTransactionStatus.PENDING,
      })
      .andWhere('tx.deleted = false')
      .getRawOne();

    return Number(result?.pending || 0);
  }

  /**
   * Get available balance (current balance minus pending withdrawals)
   */
  async getAvailableBalance(userId: string): Promise<number> {
    const [balance, pending] = await Promise.all([
      this.getBalance(userId),
      this.getPendingWithdrawals(userId),
    ]);
    return balance - pending;
  }

  /**
   * Get transaction ledger with pagination
   */
  async getLedger(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<WalletTransaction>> {
    const [data, totalItems] = await this.repo.findAndCount({
      where: { userId, deleted: false },
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
   * ADMIN: Get all transactions with filters
   */
  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<WalletTransaction>> {
    const filters = pagination.parsedFilters;
    const [data, totalItems] = await this.repo.findAndCount({
      where: {
        deleted: false,
        ...filters,
      },
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
   * Run operations in a transaction
   */
  async runInTransaction<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(work);
  }
}
