import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { RewardsService } from './rewards.service';
import { PaginationDto } from '../../common/dto';
import { CreateRewardDto } from './dto/create-reward.dto';

@Controller('referrals/rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
    constructor(private readonly rewardsService: RewardsService) { }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * GET /referrals/rewards/admin/all
     * Admin: Get all rewards with pagination
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Get('admin/all')
    findAll(@Query() pagination: PaginationDto) {
        return this.rewardsService.findAll(pagination);
    }

    /**
     * GET /referrals/rewards/admin/:id
     * Admin: Get single reward by ID
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Get('admin/:id')
    findById(@Param('id', ParseUUIDPipe) id: string) {
        return this.rewardsService.findById(id);
    }

    /**
     * POST /referrals/rewards
     * Admin: Create new reward
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Post()
    create(@Body() data: CreateRewardDto) {
        return this.rewardsService.create(data);
    }

    /**
     * PATCH /referrals/rewards/:id
     * Admin: Update reward
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() data: Partial<CreateRewardDto>) {
        return this.rewardsService.update(id, data);
    }

    /**
     * DELETE /referrals/rewards/:id
     * Admin: Soft delete reward
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.rewardsService.softDelete(id);
    }

    /**
     * POST /referrals/rewards/:id/link-window
     * Admin: Link reward to a window
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Post(':id/link-window')
    linkToWindow(@Param('id', ParseUUIDPipe) rewardId: string, @Body('windowId') windowId: string) {
        return this.rewardsService.linkToWindow(rewardId, windowId);
    }

    /**
     * POST /referrals/rewards/:id/link-plan
     * Admin: Link reward to a plan
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Post(':id/link-plan')
    linkToPlan(@Param('id', ParseUUIDPipe) rewardId: string, @Body('planId') planId: string) {
        return this.rewardsService.linkToPlan(rewardId, planId);
    }

    // ==================== USER ENDPOINTS ====================

    /**
     * GET /referrals/rewards/catalog
     * User: Get active rewards catalog
     */
    @Get('catalog')
    getCatalog() {
        return this.rewardsService.getActiveCatalog();
    }
}

