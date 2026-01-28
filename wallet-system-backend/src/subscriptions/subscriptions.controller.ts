import {
  Controller,
  Post,
  Param,
  Get,
  Req,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { DailyReturnsService } from './daily-returns.service';
import { PeriodType } from './enums';
import { Request } from 'express';
import { Role } from '../common/enums/roles.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationDto } from '../common/dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: Role;
  };
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly service: SubscriptionsService,
    private readonly dailyReturnsService: DailyReturnsService,
  ) {}

  /**
   * POST /subscriptions/buy/:planId
   * USER: Purchase a plan
   */
  @Post('buy/:planId')
  buy(@Req() req: AuthenticatedRequest, @Param('planId') planId: string) {
    return this.service.purchase(req.user.id, planId);
  }

  /**
   * GET /subscriptions/me
   * USER: View my active subscriptions
   */
  @Get('me')
  getMyPlans(@Req() req: AuthenticatedRequest) {
    return this.service.getMySubscriptions(req.user.id);
  }

  /**
   * GET /subscriptions/history
   * USER: View my subscription history
   */
  @Get('history')
  getHistory(@Req() req: AuthenticatedRequest) {
    return this.service.getSubscriptionHistory(req.user.id);
  }

  /**
   * GET /subscriptions
   * ADMIN: List all subscriptions with pagination
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  getAllSubscriptions(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  /**
   * POST /subscriptions/daily-returns/trigger
   * ADMIN: Manually trigger daily returns processing
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('daily-returns/trigger')
  triggerDailyReturns() {
    return this.dailyReturnsService.triggerManually();
  }

  /**
   * GET /subscriptions/daily-returns/my
   * USER: View my daily return logs (supports filtering and aggregation)
   * @param since - Optional ISO date string (e.g., '2025-01-01')
   * @param groupBy - Optional PeriodType enum value: 'day' | 'week' | 'month'
   */
  @Get('daily-returns/my')
  getMyDailyReturns(
    @Req() req: AuthenticatedRequest,
    @Query('since') since?: string,
    @Query('groupBy') groupBy?: PeriodType,
  ) {
    return this.dailyReturnsService.getMyDailyReturns(
      req.user.id,
      since,
      groupBy,
    );
  }

  /**
   * GET /subscriptions/daily-returns
   * ADMIN: List all daily return logs with pagination
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('daily-returns')
  getAllDailyReturns(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dailyReturnsService.findAllLogs(page, limit);
  }
}
