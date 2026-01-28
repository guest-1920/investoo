import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './subscription.entity';
import { DailyReturnLog } from './daily-return-log.entity';
import { DailyReturnSummary } from './daily-return-summary.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionExpiryService } from './subscription-expiry.service';
import { DailyReturnsService } from './daily-returns.service';
import { WalletModule } from '../wallet/wallet.module';
import { PlansModule } from '../plans/plans.module';
import { UsersModule } from '../users/users.module';
import { SettingsModule } from '../common/settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      DailyReturnLog,
      DailyReturnSummary,
    ]),
    WalletModule,
    PlansModule,
    UsersModule,
    SettingsModule,
  ],
  providers: [
    SubscriptionsService,
    SubscriptionExpiryService,
    DailyReturnsService,
  ],
  controllers: [SubscriptionsController],
  exports: [DailyReturnsService],
})
export class SubscriptionsModule {}
