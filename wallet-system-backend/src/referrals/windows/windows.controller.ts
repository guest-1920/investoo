import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { ReferralWindowService } from './windows.service';
import { PaginationDto } from '../../common/dto';
import { CreateReferralWindowDto } from './dto/create-referral-window.dto';

@Controller('referrals/windows')
@UseGuards(JwtAuthGuard)
export class ReferralWindowController {
    constructor(private readonly windowService: ReferralWindowService) { }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * GET /referrals/windows/admin/all
     * Admin: Get all windows with pagination
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Get('admin/all')
    findAll(@Query() pagination: PaginationDto) {
        return this.windowService.findAll(pagination);
    }

    /**
     * GET /referrals/windows/admin/:id
     * Admin: Get single window by ID
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Get('admin/:id')
    findById(@Param('id', ParseUUIDPipe) id: string) {
        return this.windowService.findById(id);
    }

    /**
     * POST /referrals/windows
     * Admin: Create new window
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Post()
    create(@Body() data: CreateReferralWindowDto) {
        return this.windowService.create(data);
    }

    /**
     * PATCH /referrals/windows/:id
     * Admin: Update window
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() data: Partial<CreateReferralWindowDto>) {
        return this.windowService.update(id, data);
    }

    /**
     * PATCH /referrals/windows/:id/activate
     * Admin: Activate window
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id/activate')
    activate(@Param('id', ParseUUIDPipe) id: string) {
        return this.windowService.setActive(id, true);
    }

    /**
     * PATCH /referrals/windows/:id/deactivate
     * Admin: Deactivate window
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id/deactivate')
    deactivate(@Param('id', ParseUUIDPipe) id: string) {
        return this.windowService.setActive(id, false);
    }

    /**
     * DELETE /referrals/windows/:id
     * Admin: Soft delete window
     */
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.windowService.softDelete(id);
    }

    // ==================== USER ENDPOINTS ====================

    /**
     * GET /referrals/windows/active
     * User: Get active windows they can participate in
     */
    @Get('active')
    getActiveWindows() {
        return this.windowService.getActiveWindows();
    }

    /**
     * GET /referrals/windows/my-progress
     * User: Get their progress on all active windows
     */
    @Get('my-progress')
    getMyProgress(@Request() req) {
        return this.windowService.getUserProgress(req.user.id);
    }
}

