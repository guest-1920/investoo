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
import { RechargeService } from './recharge.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateRechargeDto } from './dto/create-recharge.dto';
import { RechargeDecisionDto } from './dto/decision.dto';
import { PaginationDto } from '../common/dto';
import { Request } from 'express';
import { Role } from '../common/enums/roles.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: Role;
  };
}

@Controller('recharges')
export class RechargeController {
  constructor(private readonly service: RechargeService) {}

  /**
   * POST /recharges
   * USER: Request a recharge
   */
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateRechargeDto) {
    return this.service.create(
      req.user.id,
      dto.amount,
      dto.proofKey,
      dto.chainName,
    );
  }

  /**
   * GET /recharges/my
   * USER: Get my recharges
   */
  @Get('my')
  getMyRecharges(
    @Req() req: AuthenticatedRequest,
    @Query() pagination: PaginationDto,
  ) {
    return this.service.findByUser(req.user.id, pagination);
  }

  /**
   * GET /recharges/pending
   * ADMIN: List pending recharges
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('pending')
  findPending(@Query() pagination: PaginationDto) {
    return this.service.findPending(pagination);
  }

  /**
   * GET /recharges
   * ADMIN: List all recharges
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  /**
   * PATCH /recharges/:id
   * ADMIN: Approve or reject recharge
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  decide(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RechargeDecisionDto,
  ) {
    return this.service.decide(
      id,
      dto.status,
      dto.adminRemark,
      req.user.id,
      dto.transactionId,
    );
  }

  /**
   * POST /recharges/:id/scan-proof
   * ADMIN: Scan proof for text
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/scan-proof')
  scanProof(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.scanProof(id);
  }
}
