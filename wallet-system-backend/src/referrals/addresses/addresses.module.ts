import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerAddress } from './entities/customer-address.entity';
import { AddressService } from './addresses.service';

import { AddressesController } from './addresses.controller';

@Module({
    imports: [TypeOrmModule.forFeature([CustomerAddress])],
    controllers: [AddressesController],
    providers: [AddressService],
    exports: [TypeOrmModule, AddressService],
})
export class AddressesModule { }
