import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { SupportTicket, TicketStatus } from './support-ticket.entity';
import { TicketReply } from './ticket-reply.entity';
import { CreateTicketDto, TicketReplyDto, UpdateStatusDto } from './dto';
import { PaginationDto, PaginatedResponseDto } from '../common/dto';
import { EmailProducer } from '../common/email/email.producer';
import { UsersService } from '../users/users.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private ticketCounter = 0;

  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(TicketReply)
    private readonly replyRepo: Repository<TicketReply>,
    private readonly emailProducer: EmailProducer,
    private readonly usersService: UsersService,
  ) {
    // Initialize counter from database on startup
    this.initializeCounter();
  }

  private async initializeCounter() {
    const lastTicket = await this.ticketRepo.findOne({
      order: { createdAt: 'DESC' },
      where: { deleted: false },
    });
    if (lastTicket) {
      const num = parseInt(lastTicket.ticketNumber.replace('T-', ''), 10);
      this.ticketCounter = isNaN(num) ? 0 : num;
    }
  }

  private generateTicketNumber(): string {
    this.ticketCounter++;
    return `T-${this.ticketCounter.toString().padStart(5, '0')}`;
  }

  /**
   * USER: Create a new support ticket
   */
  async create(userId: string, dto: CreateTicketDto): Promise<SupportTicket> {
    const ticketNumber = this.generateTicketNumber();

    // Create ticket
    const ticket = await this.ticketRepo.save(
      this.ticketRepo.create({
        ticketNumber,
        userId,
        subject: dto.subject,
        department: dto.department,
        priority: dto.priority,
        status: TicketStatus.OPEN,
      }),
    );

    // Create initial message as first reply
    await this.replyRepo.save(
      this.replyRepo.create({
        ticketId: ticket.id,
        userId,
        message: dto.message,
        isAdminReply: false,
      }),
    );

    this.logger.log(
      `Ticket created: ${ticketNumber}, userId=${userId}, subject=${dto.subject}`,
    );

    return ticket;
  }

  /**
   * USER: Get user's tickets with pagination (excludes CLOSED tickets)
   */
  async findByUser(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<SupportTicket>> {
    const [data, totalItems] = await this.ticketRepo.findAndCount({
      where: {
        userId,
        deleted: false,
        status: Not(TicketStatus.CLOSED),
      },
      order: { [pagination.sortBy!]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.take,
    });

    return PaginatedResponseDto.create(
      data,
      totalItems,
      pagination.page!,
      pagination.limit!,
    );
  }

  /**
   * ADMIN: Get all tickets with pagination and filters
   */
  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<SupportTicket>> {
    const filters = pagination.parsedFilters;
    const [data, totalItems] = await this.ticketRepo.findAndCount({
      where: { deleted: false, ...filters },
      relations: ['user'],
      order: { [pagination.sortBy!]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.take,
    });

    return PaginatedResponseDto.create(
      data,
      totalItems,
      pagination.page!,
      pagination.limit!,
    );
  }

  /**
   * Get single ticket with replies
   */
  async findOne(id: string, userId?: string): Promise<SupportTicket> {
    const where: any = { id, deleted: false };
    if (userId) {
      where.userId = userId; // Ensure user owns the ticket
    }

    const ticket = await this.ticketRepo.findOne({
      where,
      relations: ['replies', 'replies.user', 'user'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Sort replies by createdAt
    if (ticket.replies) {
      ticket.replies.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }

    return ticket;
  }

  /**
   * Add a reply to a ticket
   */
  async addReply(
    ticketId: string,
    userId: string,
    dto: TicketReplyDto,
    isAdmin: boolean,
  ): Promise<TicketReply> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId, deleted: false },
      relations: ['user'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Non-admin can only reply to their own tickets
    if (!isAdmin && ticket.userId !== userId) {
      throw new NotFoundException('Ticket not found');
    }

    const reply = await this.replyRepo.save(
      this.replyRepo.create({
        ticketId,
        userId,
        message: dto.message,
        isAdminReply: isAdmin,
      }),
    );

    // If admin replies, set status to IN_PROGRESS if still OPEN
    if (isAdmin && ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
      await this.ticketRepo.save(ticket);
    }

    // Send email notification if admin replies
    if (isAdmin) {
      await this.emailProducer.sendTicketReplyNotification(
        ticket.user.email,
        ticket.ticketNumber,
        ticket.subject,
      );
      this.logger.log(`Admin replied to ticket ${ticket.ticketNumber}`);
    }

    return reply;
  }

  /**
   * ADMIN: Update ticket status
   */
  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    adminId: string,
  ): Promise<SupportTicket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id, deleted: false },
      relations: ['user'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const previousStatus = ticket.status;
    ticket.status = dto.status;
    await this.ticketRepo.save(ticket);

    // Send email notification for resolved/closed status
    if (
      (dto.status === TicketStatus.RESOLVED ||
        dto.status === TicketStatus.CLOSED) &&
      previousStatus !== dto.status
    ) {
      await this.emailProducer.sendTicketStatusNotification(
        ticket.user.email,
        ticket.ticketNumber,
        ticket.subject,
        dto.status,
      );
    }

    this.logger.log(
      `Ticket ${ticket.ticketNumber} status updated: ${previousStatus} -> ${dto.status} by admin ${adminId}`,
    );

    return ticket;
  }
}
