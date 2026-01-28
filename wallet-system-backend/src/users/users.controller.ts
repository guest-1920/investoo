import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Req,
  ParseUUIDPipe,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateUserAdminDto } from './dto';
import { Request } from 'express';
import { Role } from '../common/enums/roles.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: Role;
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/me
   * Get current authenticated user
   */
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.id);
  }

  /**
   * PATCH /users/me
   * Update current user's profile
   */
  @Patch('me')
  async updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.update(req.user.id, dto);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  /**
   * GET /users/referrals/stats
   * Get referral statistics for current user
   */
  @Get('referrals/stats')
  async getReferralStats(@Req() req: AuthenticatedRequest) {
    return this.usersService.getReferralStats(req.user.id);
  }

  /**
   * GET /users
   * ADMIN: Get all users with pagination
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.findAll(page, limit);
  }

  /**
   * GET /users/:id
   * ADMIN: Get any user by ID
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * PATCH /users/:id
   * ADMIN: Update any user's profile (including role)
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserAdminDto,
  ) {
    const updated = await this.usersService.update(id, dto);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }
}
