import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ReferralWindow } from './entities/referral-window.entity';
import { ReferralWindowProgress } from './entities/referral-window-progress.entity';
import { ReferralWindowService } from './windows.service';
import { ReferralWindowListener } from './windows.listener';
import { WindowsExpiryService } from './windows-expiry.service';
import { ReferralWindowController } from './windows.controller';
import { Subscription } from '../../subscriptions/subscription.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ReferralWindow, ReferralWindowProgress, Subscription]),
        EventEmitterModule.forRoot(),
    ],
    controllers: [ReferralWindowController],
    providers: [ReferralWindowService, ReferralWindowListener, WindowsExpiryService],
    exports: [TypeOrmModule, ReferralWindowService],
})
export class WindowsModule { }
