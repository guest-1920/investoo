import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WithdrawalsService } from './withdrawals.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalDecisionDto } from './dto/withdrawal-decision.dto';
import { PaginationDto } from '../common/dto';
import { Request } from 'express';
import { Role } from '../common/enums/roles.enum';
import { Public } from '../auth/decorators/public.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: Role;
  };
}

@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly service: WithdrawalsService) {}

  /**
   * POST /withdrawals/verify
   * Verify email token and create withdrawal
   */
  @Public()
  @Post('verify')
  verify(@Body('token') token: string) {
    return this.service.verifyAndCreate(token);
  }

  /**
   * POST /withdrawals
   * USER: Request a withdrawal
   */
  @Post()
  request(@Req() req: AuthenticatedRequest, @Body() dto: CreateWithdrawalDto) {
    return this.service.requestWithdrawal(
      req.user.id,
      dto.amount,
      dto.blockchainAddress,
      dto.chainName,
    );
  }

  /**
   * GET /withdrawals/my
   * USER: Get my withdrawals
   */
  @Get('my')
  getMyWithdrawals(
    @Req() req: AuthenticatedRequest,
    @Query() pagination: PaginationDto,
  ) {
    return this.service.findByUser(req.user.id, pagination);
  }

  /**
   * GET /withdrawals/pending
   * ADMIN: View pending withdrawals
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('pending')
  findPending(@Query() pagination: PaginationDto) {
    return this.service.findPending(pagination);
  }

  /**
   * GET /withdrawals
   * ADMIN: View all withdrawals
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  /**
   * PATCH /withdrawals/:id
   * ADMIN: Approve or reject withdrawal
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  decide(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WithdrawalDecisionDto,
  ) {
    return this.service.decide(id, dto.status, dto.adminRemark, req.user.id);
  }
}
