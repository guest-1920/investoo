import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Reward } from './entities/reward.entity';
import { PlanReward } from './entities/plan-reward.entity';
import { WindowReward } from './entities/window-reward.entity';
import { UsersModule } from '../../users/users.module';
import { FulfillmentsModule } from '../fulfillments/fulfillments.module';
import { EmailQueueModule } from '../../common/email/email-queue.module';
import { WalletModule } from '../../wallet/wallet.module';
import { RewardsService } from './rewards.service';
import { RewardsListener } from './rewards.listener';
import { RewardsProcessor } from './rewards.processor';

import { RewardsController } from './rewards.controller';

import { Plan } from '../../plans/plan.entity';
import { ReferralWindow } from '../windows/entities/referral-window.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Reward, PlanReward, WindowReward, Plan, ReferralWindow]),
        BullModule.registerQueue({ name: 'rewards' }),
        UsersModule,
        FulfillmentsModule,
        EmailQueueModule,
        WalletModule,
    ],
    controllers: [RewardsController],
    providers: [RewardsService, RewardsListener, RewardsProcessor],
    exports: [TypeOrmModule, RewardsService],
})
export class RewardsModule { }
