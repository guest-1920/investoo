import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AddressService } from './addresses.service';

@Controller('referrals/addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
    constructor(private readonly addressService: AddressService) { }

    @Get()
    async getMyAddresses(@Request() req) {
        return this.addressService.findAllForUser(req.user.id);
    }

    @Post()
    async createAddress(@Request() req, @Body() body: any) {
        return this.addressService.create(req.user.id, body);
    }

    @Patch(':id')
    async updateAddress(@Request() req, @Param('id') id: string, @Body() body: any) {
        return this.addressService.update(req.user.id, id, body);
    }

    @Patch(':id/default')
    async setDefaultAddress(@Request() req, @Param('id') id: string) {
        return this.addressService.setDefault(req.user.id, id);
    }

    @Delete(':id')
    async deleteAddress(@Request() req, @Param('id') id: string) {
        return this.addressService.delete(req.user.id, id);
    }
}
