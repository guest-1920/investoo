import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { FulfillmentsService } from './fulfillments.service';
import { FulfillmentStatus } from './entities/reward-fulfillment.entity';
import { PaginationDto } from '../../common/dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RewardClaimRequestedEvent } from '../../common/events/domain-events';

@Controller('referrals/fulfillments')
@UseGuards(JwtAuthGuard)
export class FulfillmentsController {
    constructor(
        private readonly fulfillmentsService: FulfillmentsService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    // ==================== ADMIN ENDPOINTS ====================

    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Get('admin/all')
    findAll(@Query() pagination: PaginationDto) {
        return this.fulfillmentsService.findAll(pagination);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Get('admin/pending')
    findPending(@Query() pagination: PaginationDto) {
        return this.fulfillmentsService.findByStatus(FulfillmentStatus.PENDING, pagination);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Get('admin/:id')
    findById(@Param('id', ParseUUIDPipe) id: string) {
        return this.fulfillmentsService.findById(id);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Patch('admin/:id/status')
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { status: string, trackingNumber?: string, notes?: string }
    ) {
        return this.fulfillmentsService.updateStatus(id, body.status, body.trackingNumber, body.notes);
    }

    // ==================== USER ENDPOINTS ====================

    @Get('my-fulfillments')
    getMyFulfillments(
        @Request() req,
        @Query() pagination: PaginationDto
    ) {
        return this.fulfillmentsService.findByUser(req.user.id, pagination, pagination.status as FulfillmentStatus);
    }

    @Patch(':id/address')
    setDeliveryAddress(
        @Request() req,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { addressId: string }
    ) {
        return this.fulfillmentsService.setDeliveryAddress(req.user.id, id, body.addressId);
    }

    /**
     * POST /referrals/fulfillments/claim
     * User: Claim a reward (Wallet Credit or Physical)
     * NON-BLOCKING: Emits event and returns immediately
     */
    @Post('claim')
    async claimReward(
        @Request() req,
        @Body() body: {
            rewardId: string;
            sourceId: string;
            sourceType: 'PLAN' | 'WINDOW';
            claimType: 'WALLET' | 'PHYSICAL';
            addressId?: string;
        }
    ) {
        // Emit event for async processing
        this.eventEmitter.emit(
            'reward.claim.requested',
            new RewardClaimRequestedEvent({
                userId: req.user.id,
                rewardId: body.rewardId,
                sourceId: body.sourceId,
                sourceType: body.sourceType,
                claimType: body.claimType,
                addressId: body.addressId,
            })
        );

        return {
            status: 'Processing',
            message: 'Your claim request has been queued.'
        };
    }
}
