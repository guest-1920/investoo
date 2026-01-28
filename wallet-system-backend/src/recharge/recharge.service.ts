import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Recharge, RechargeStatus } from './recharge.entity';
import { WalletService } from '../wallet/wallet.service';
import { UploadService } from '../upload/upload.service';
import { WalletTransactionSource } from '../wallet/enums/wallet.enums';
import { PaginationDto, PaginatedResponseDto } from '../common/dto';
import { SettingsService } from '../common/settings/settings.service';

@Injectable()
export class RechargeService {
  private readonly logger = new Logger(RechargeService.name);

  constructor(
    @InjectRepository(Recharge)
    private readonly repo: Repository<Recharge>,
    private readonly walletService: WalletService,
    private readonly uploadService: UploadService,
    private readonly dataSource: DataSource,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * USER: Create a recharge request
   */
  async create(
    userId: string,
    amount: number,
    proofKey: string,
    chainName: string,
  ): Promise<Recharge> {
    const settings = await this.settingsService.getFinancialSettings();
    if (amount < settings.minRecharge) {
      throw new BadRequestException(
        `Minimum recharge amount is ${settings.minRecharge}`,
      );
    }

    const recharge = await this.repo.save(
      this.repo.create({
        userId,
        amount,
        proofKey,
        chainName,
        status: RechargeStatus.PENDING,
      }),
    );

    this.logger.log(
      `Recharge requested: id=${recharge.id}, userId=${userId}, amount=${amount}`,
    );

    return recharge;
  }

  /**
   * ADMIN: Approve or reject a recharge
   * Uses transaction to ensure wallet credit is atomic
   */
  async decide(
    id: string,
    status: RechargeStatus,
    adminRemark?: string,
    approvedById?: string,
    transactionId?: string,
  ): Promise<Recharge> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Recharge);

      const recharge = await repo.findOne({
        where: { id, deleted: false },
        lock: { mode: 'pessimistic_write' },
      });

      if (!recharge) {
        throw new NotFoundException('Recharge not found');
      }

      if (recharge.status !== RechargeStatus.PENDING) {
        throw new BadRequestException(
          `Recharge already processed with status: ${recharge.status}`,
        );
      }

      // Check transactionId requirements for APPROVAL
      if (status === RechargeStatus.APPROVED) {
        if (!transactionId) {
          throw new BadRequestException(
            'Transaction ID is required for approval',
          );
        }

        // Uniqueness check
        const existing = await repo.findOne({ where: { transactionId } });
        if (existing) {
          throw new ConflictException(
            `Transaction ID ${transactionId} already used`,
          );
        }
        recharge.transactionId = transactionId;
      }

      recharge.status = status;
      if (adminRemark) {
        recharge.adminRemark = adminRemark;
      }
      if (approvedById) {
        recharge.approvedById = approvedById;
      }

      if (status === RechargeStatus.APPROVED) {
        // Credit wallet within the same transaction
        await this.walletService.credit(
          recharge.userId,
          recharge.amount,
          WalletTransactionSource.RECHARGE,
          recharge.id,
          manager,
        );
        this.logger.log(
          `Recharge approved: id=${id}, userId=${recharge.userId}, amount=${recharge.amount}, txId=${transactionId}`,
        );
      } else {
        this.logger.log(
          `Recharge rejected: id=${id}, userId=${recharge.userId}, reason=${adminRemark}`,
        );
      }

      return repo.save(recharge);
    });
  }

  async scanProof(id: string): Promise<any[]> {
    const recharge = await this.repo.findOne({ where: { id } });
    if (!recharge) {
      throw new NotFoundException('Recharge not found');
    }
    return this.uploadService.scanS3Object(recharge.proofKey);
  }

  /**
   * ADMIN: Find pending recharges with pagination
   */
  async findPending(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Recharge>> {
    const [data, totalItems] = await this.repo.findAndCount({
      where: { status: RechargeStatus.PENDING, deleted: false },
      order: { createdAt: 'ASC' },
      skip: pagination.skip,
      take: pagination.take,
    });

    // Sign URLs
    const dataWithSignedUrls = await Promise.all(
      data.map(async (item) => {
        const url = await this.uploadService.getPresignedDownloadUrl(
          item.proofKey,
        );
        return { ...item, proofUrl: url };
      }),
    );

    return PaginatedResponseDto.create(
      dataWithSignedUrls as any,
      totalItems,
      pagination.page!,
      pagination.limit!,
    );
  }

  /**
   * ADMIN: Find all recharges with pagination
   */
  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Recharge>> {
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

    // Sign URLs
    const dataWithSignedUrls = await Promise.all(
      data.map(async (item) => {
        const url = await this.uploadService.getPresignedDownloadUrl(
          item.proofKey,
        );
        return { ...item, proofUrl: url };
      }),
    );

    return PaginatedResponseDto.create(
      dataWithSignedUrls as any,
      totalItems,
      pagination.page!,
      pagination.limit!,
    );
  }

  /**
   * Get user's recharges with pagination
   */
  async findByUser(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Recharge>> {
    const [data, totalItems] = await this.repo.findAndCount({
      where: { userId, deleted: false },
      order: { [pagination.sortBy!]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.take,
    });

    // Sign URLs
    const dataWithSignedUrls = await Promise.all(
      data.map(async (item) => {
        const url = await this.uploadService.getPresignedDownloadUrl(
          item.proofKey,
        );
        return { ...item, proofUrl: url };
      }),
    );

    return PaginatedResponseDto.create(
      dataWithSignedUrls as any,
      totalItems,
      pagination.page!,
      pagination.limit!,
    );
  }
}
