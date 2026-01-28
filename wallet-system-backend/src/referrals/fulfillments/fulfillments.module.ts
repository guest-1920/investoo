import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardFulfillment } from './entities/reward-fulfillment.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { FulfillmentsService } from './fulfillments.service';
import { FulfillmentsController } from './fulfillments.controller';
import { FulfillmentStatusListener } from './fulfillment-status.listener';
import { EmailQueueModule } from '../../common/email/email-queue.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([RewardFulfillment, Reward]),
        EmailQueueModule,
    ],
    controllers: [FulfillmentsController],
    providers: [FulfillmentsService, FulfillmentStatusListener],
    exports: [TypeOrmModule, FulfillmentsService],
})
export class FulfillmentsModule { }

