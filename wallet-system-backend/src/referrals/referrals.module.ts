import { Module } from '@nestjs/common';
import { WindowsModule } from './windows/windows.module';
import { RewardsModule } from './rewards/rewards.module';
import { FulfillmentsModule } from './fulfillments/fulfillments.module';
import { AddressesModule } from './addresses/addresses.module';

import { ReferralsController } from './referrals.controller';
import { UsersService } from 'src/users/users.service';


@Module({
    imports: [
        WindowsModule,
        RewardsModule,
        FulfillmentsModule,
        AddressesModule,
    ],
    providers: [UsersService],
    controllers: [ReferralsController],
    exports: [
        WindowsModule,
        RewardsModule,
        FulfillmentsModule,
        AddressesModule,
    ],
})
export class ReferralsModule { }
