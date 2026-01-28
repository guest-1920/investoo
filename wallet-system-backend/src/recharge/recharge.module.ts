import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recharge } from './recharge.entity';
import { RechargeService } from './recharge.service';
import { RechargeController } from './recharge.controller';
import { WalletModule } from '../wallet/wallet.module';
import { UploadModule } from '../upload/upload.module';
import { SettingsModule } from '../common/settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recharge]),
    WalletModule,
    UploadModule,
    SettingsModule,
  ],
  providers: [RechargeService],
  controllers: [RechargeController],
})
export class RechargeModule {}
