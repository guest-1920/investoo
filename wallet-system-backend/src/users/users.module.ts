import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { WalletTransaction } from '../wallet/wallet-transaction.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SettingsModule } from '../common/settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, WalletTransaction]),
    SettingsModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule { }