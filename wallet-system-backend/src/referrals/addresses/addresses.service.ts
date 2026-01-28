import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerAddress } from './entities/customer-address.entity';

@Injectable()
export class AddressService {
    constructor(
        @InjectRepository(CustomerAddress)
        private readonly addressRepo: Repository<CustomerAddress>,
    ) { }

    async findAllForUser(userId: string): Promise<CustomerAddress[]> {
        return this.addressRepo.find({
            where: { userId, deleted: false },
            order: { isDefault: 'DESC', createdAt: 'DESC' },
        });
    }

    async create(userId: string, data: Partial<CustomerAddress>): Promise<CustomerAddress> {
        // If setting as default, unset others first
        if (data.isDefault) {
            await this.unsetDefaults(userId);
        }

        const address = this.addressRepo.create({ ...data, userId });
        return this.addressRepo.save(address);
    }

    async update(userId: string, addressId: string, data: Partial<CustomerAddress>): Promise<CustomerAddress> {
        const address = await this.addressRepo.findOne({ where: { id: addressId, userId } });
        if (!address) throw new Error('Address not found');

        if (data.isDefault) {
            await this.unsetDefaults(userId);
        }

        Object.assign(address, data);
        return this.addressRepo.save(address);
    }

    async delete(userId: string, addressId: string): Promise<void> {
        // Soft delete
        await this.addressRepo.update({ id: addressId, userId }, { deleted: true });
    }

    async setDefault(userId: string, addressId: string): Promise<void> {
        await this.unsetDefaults(userId);
        await this.addressRepo.update({ id: addressId, userId }, { isDefault: true });
    }

    private async unsetDefaults(userId: string) {
        await this.addressRepo.update({ userId, isDefault: true }, { isDefault: false });
    }
}
