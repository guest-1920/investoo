import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AuditedEntity } from '../common/entities/audited.entity';
import { User } from '../users/user.entity';
import { SupportTicket } from './support-ticket.entity';

@Entity('ticket_replies')
@Index('IDX_ticket_reply_ticket', ['ticketId'])
export class TicketReply extends AuditedEntity {
  @Column({ type: 'uuid' })
  ticketId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  isAdminReply: boolean;

  // ============ RELATIONS ============

  @ManyToOne(() => SupportTicket, (ticket) => ticket.replies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticketId' })
  ticket: SupportTicket;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
