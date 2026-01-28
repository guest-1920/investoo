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
import { SupportService } from './support.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateTicketDto, TicketReplyDto, UpdateStatusDto } from './dto';
import { PaginationDto } from '../common/dto';
import { Request } from 'express';
import { Role } from '../common/enums/roles.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: Role;
  };
}

@Controller('support')
export class SupportController {
  constructor(private readonly service: SupportService) { }

  /**
   * POST /support
   * USER: Create a new support ticket
   */
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTicketDto) {
    return this.service.create(req.user.id, dto);
  }

  /**
   * GET /support/my
   * USER: Get my tickets with pagination
   */
  @Get('my')
  getMyTickets(
    @Req() req: AuthenticatedRequest,
    @Query() pagination: PaginationDto,
  ) {
    return this.service.findByUser(req.user.id, pagination);
  }

  /**
   * GET /support/:id
   * USER/ADMIN: Get single ticket with replies
   */
  @Get(':id')
  getTicket(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // Admins can see any ticket, users can only see their own
    const userId = req.user.role === Role.ADMIN ? undefined : req.user.id;
    return this.service.findOne(id, userId);
  }

  /**
   * POST /support/:id/reply
   * USER/ADMIN: Add reply to ticket
   */
  @Post(':id/reply')
  addReply(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TicketReplyDto,
  ) {
    const isAdmin = req.user.role === Role.ADMIN;
    return this.service.addReply(id, req.user.id, dto, isAdmin);
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * GET /support
   * ADMIN: List all tickets with pagination and filters
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  /**
   * PATCH /support/:id/status
   * ADMIN: Update ticket status
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.service.updateStatus(id, dto, req.user.id);
  }
}
