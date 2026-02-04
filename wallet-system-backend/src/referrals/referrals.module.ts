import { Module } from '@nestjs/common';
import { WindowsModule } from './windows/windows.module';
import { RewardsModule } from './rewards/rewards.module';
import { FulfillmentsModule } from './fulfillments/fulfillments.module';
import { AddressesModule } from './addresses/addresses.module';
import { UsersModule } from '../users/users.module';

import { ReferralsController } from './referrals.controller';


@Module({
    imports: [
        WindowsModule,
        RewardsModule,
        FulfillmentsModule,
        AddressesModule,
        UsersModule,
    ],
    controllers: [ReferralsController],
    exports: [
        WindowsModule,
        RewardsModule,
        FulfillmentsModule,
        AddressesModule,
    ],
})
export class ReferralsModule { }