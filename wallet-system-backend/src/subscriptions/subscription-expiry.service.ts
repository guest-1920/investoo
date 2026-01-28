import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { Subscription } from './subscription.entity';
import { WalletService } from '../wallet/wallet.service';
import { SettingsService } from '../common/settings/settings.service';
import { WalletTransactionSource } from '../wallet/enums/wallet.enums';

@Injectable()
export class SubscriptionExpiryService {
  private readonly logger = new Logger(SubscriptionExpiryService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly repo: Repository<Subscription>,
    private readonly walletService: WalletService,
    private readonly settingsService: SettingsService,
    private readonly dataSource: DataSource,
  ) {}

  // 🕛 Runs every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireSubscriptions() {
    this.logger.log('Checking for expiring subscriptions...');

    const now = new Date();

    // 1. Fetch expired subscriptions with Plan and User
    const expired = await this.repo.find({
      where: {
        isActive: true,
        endDate: LessThan(now),
      },
      relations: ['plan', 'user'],
    });

    if (expired.length === 0) {
      return;
    }

    // 2. Fetch financial settings
    const settings = await this.settingsService.getFinancialSettings();
    const taxPercent = settings.principalTax || 0;

    this.logger.log(
      `Found ${expired.length} subscriptions to expire. Principal Tax: ${taxPercent}%`,
    );

    // 3. Process each subscription
    for (const sub of expired) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Calculate Return Amount
        // Amount = Price - (Price * Tax / 100)
        // Ensure price is treated as number
        const price = Number(sub.plan.price);
        const taxAmount = (price * taxPercent) / 100;
        const returnAmount = price - taxAmount;

        // Credit Wallet
        if (returnAmount > 0) {
          await this.walletService.credit(
            sub.userId,
            returnAmount,
            WalletTransactionSource.PRINCIPAL_RETURN,
            sub.id,
            queryRunner.manager,
          );
        }

        // Mark as Inactive
        sub.isActive = false;
        await queryRunner.manager.save(sub);

        await queryRunner.commitTransaction();
        this.logger.log(
          `Subscription ${sub.id} expired. Principal returned: ${returnAmount} (Tax: ${taxAmount})`,
        );
      } catch (err) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Failed to expire subscription ${sub.id}`, err.stack);
      } finally {
        await queryRunner.release();
      }
    }
  }
}
