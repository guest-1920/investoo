import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Withdrawal, WithdrawalStatus } from './withdrawals.entity';
import { WalletService } from '../wallet/wallet.service';
import { WalletTransactionSource } from '../wallet/enums/wallet.enums';
import { PaginationDto, PaginatedResponseDto } from '../common/dto';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { EmailProducer } from '../common/email/email.producer';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { SettingsService } from '../common/settings/settings.service';

@Injectable()
export class WithdrawalsService {
  private readonly logger = new Logger(WithdrawalsService.name);

  constructor(
    @InjectRepository(Withdrawal)
    private readonly repo: Repository<Withdrawal>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly emailProducer: EmailProducer,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly settingsService: SettingsService,
  ) { }

  /**
   * USER: Request a withdrawal (Step 1)
   * Validates balance and sends verification email.
   * Does NOT create a DB record yet.
   */
  async requestWithdrawal(
    userId: string,
    amount: number,
    blockchainAddress: string,
    chainName: string,
  ): Promise<{ message: string }> {
    // 1. Pre-Check available balance
    const availableBalance =
      await this.walletService.getAvailableBalance(userId);

    // Ensure amount is parsed as number
    const numericAmount = Number(amount);

    if (availableBalance < numericAmount) {
      throw new BadRequestException(
        `Insufficient available balance. Available: ${availableBalance}, Requested: ${numericAmount}`,
      );
    }

    // 2. Fetch User and Settings
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const settings = await this.settingsService.getFinancialSettings();
    if (numericAmount < settings.minWithdrawal) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ${settings.minWithdrawal}`,
      );
    }

    // Optional: Check if amount covers fee
    // const fee = (numericAmount * settings.withdrawalFee) / 100;
    // if (numericAmount <= fee) {
    //      throw new BadRequestException('Amount must be greater than withdrawal fee');
    // }

    // 3. Calculate Fees (Fixed Amount)
    const fee = Number(settings.withdrawalFee);

    // Validate amount > fee
    if (numericAmount <= fee) {
      throw new BadRequestException(`Amount must be greater than the withdrawal fee of $${fee}`);
    }

    const netAmount = numericAmount - fee;

    // 4. Generate Token and Cache Data
    const token = randomUUID();
    const redisKey = `withdrawal:verify:${token}`;
    const withdrawalData = {
      userId,
      amount: numericAmount,
      blockchainAddress,
      chainName,
      fee,
      netAmount,
    };

    // TTL: 15 minutes (900 seconds)
    await this.redis.set(redisKey, JSON.stringify(withdrawalData), 'EX', 900);

    // 5. Send Email
    await this.emailProducer.sendWithdrawalVerificationEmail(
      user.email,
      token,
      numericAmount,
      'USDT',
    );

    return { message: 'Verification email sent. Please check your inbox.' };
  }

  /**
   * USER: Verify Email and Create Withdrawal (Step 2)
   */
  async verifyAndCreate(token: string): Promise<Withdrawal> {
    const redisKey = `withdrawal:verify:${token}`;
    const dataString = await this.redis.get(redisKey);

    if (!dataString) {
      throw new BadRequestException('Invalid or expired verification link.');
    }

    const data = JSON.parse(dataString);
    const { userId, amount, blockchainAddress, chainName, fee, netAmount } =
      data;

    // CRITICAL: Check balance AGAIN
    const availableBalance =
      await this.walletService.getAvailableBalance(userId);
    if (availableBalance < amount) {
      // Delete key to prevent repeated attempts?
      // Or keep it so they can try again if they deposit?
      // Better to fail and let them restart request properly.
      await this.redis.del(redisKey);
      throw new BadRequestException(
        'Insufficient balance at time of verification.',
      );
    }

    // Create Withdrawal
    const withdrawal = await this.repo.save(
      this.repo.create({
        userId,
        amount,
        blockchainAddress,
        chainName,
        status: WithdrawalStatus.PENDING,
        fee: fee || 0,
        netAmount: netAmount || amount,
      }),
    );

    // Cleanup
    await this.redis.del(redisKey);

    this.logger.log(
      `Withdrawal verified & created: id=${withdrawal.id}, userId=${userId}, amount=${amount}`,
    );

    return withdrawal;
  }

  /**
   * ADMIN: Approve or reject a withdrawal
   * Uses transaction to ensure atomicity
   */
  async decide(
    id: string,
    status: WithdrawalStatus,
    adminRemark?: string,
    approvedById?: string,
  ): Promise<Withdrawal> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Withdrawal);

      const withdrawal = await repo.findOne({
        where: { id, deleted: false },
        lock: { mode: 'pessimistic_write' },
      });

      if (!withdrawal) {
        throw new NotFoundException('Withdrawal not found');
      }

      if (withdrawal.status !== WithdrawalStatus.PENDING) {
        throw new BadRequestException(
          `Withdrawal already processed with status: ${withdrawal.status}`,
        );
      }

      withdrawal.status = status;
      if (adminRemark !== undefined) {
        withdrawal.adminRemark = adminRemark;
      }
      if (approvedById) {
        withdrawal.approvedById = approvedById;
      }

      if (status === WithdrawalStatus.APPROVED) {
        // Debit wallet within the same transaction
        await this.walletService.debit(
          withdrawal.userId,
          withdrawal.amount,
          WalletTransactionSource.WITHDRAW,
          withdrawal.id,
          manager,
        );
        this.logger.log(
          `Withdrawal approved: id=${id}, userId=${withdrawal.userId}, amount=${withdrawal.amount}`,
        );
      } else {
        this.logger.log(
          `Withdrawal rejected: id=${id}, userId=${withdrawal.userId}, reason=${adminRemark}`,
        );
      }

      return repo.save(withdrawal);
    });
  }

  /**
   * ADMIN: Find all pending withdrawals with pagination
   */
  async findPending(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Withdrawal>> {
    const [data, totalItems] = await this.repo.findAndCount({
      where: { status: WithdrawalStatus.PENDING, deleted: false },
      order: { createdAt: 'ASC' },
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
   * ADMIN: Find all withdrawals with pagination
   */
  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Withdrawal>> {
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
   * Get user's withdrawals with pagination
   */
  async findByUser(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Withdrawal>> {
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
}
