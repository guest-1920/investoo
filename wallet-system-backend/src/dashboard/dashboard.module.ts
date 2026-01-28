import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/user.entity';
import { Recharge } from '../recharge/recharge.entity';
import { Withdrawal } from '../withdrawals/withdrawals.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { WalletTransaction } from '../wallet/wallet-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Recharge,
      Withdrawal,
      Subscription,
      WalletTransaction,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
