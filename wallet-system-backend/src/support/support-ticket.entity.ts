import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { AuditedEntity } from '../common/entities/audited.entity';
import { User } from '../users/user.entity';
import { GridSchema, Field } from '../common/schema';
import { TicketReply } from './ticket-reply.entity';

export enum TicketDepartment {
  GENERAL = 'GENERAL',
  BILLING = 'BILLING',
  TECHNICAL = 'TECHNICAL',
}

export enum TicketPriority {
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

@GridSchema('support-tickets')
@Entity('support_tickets')
@Index('IDX_support_ticket_user', ['userId'])
@Index('IDX_support_ticket_status', ['status'])
export class SupportTicket extends AuditedEntity {
  @Field({ label: 'Ticket #', order: 0 })
  @Column({ unique: true })
  ticketNumber: string;

  @Field({ label: 'User', order: 1 })
  @Column({ type: 'uuid' })
  userId: string;

  @Field({ label: 'Subject', order: 2 })
  @Column()
  subject: string;

  @Field({ label: 'Department', type: 'select', format: 'badge', order: 3 })
  @Column({
    type: 'enum',
    enum: TicketDepartment,
    default: TicketDepartment.GENERAL,
  })
  department: TicketDepartment;

  @Field({ label: 'Priority', type: 'select', format: 'badge', order: 4 })
  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.NORMAL,
  })
  priority: TicketPriority;

  @Field({
    label: 'Status',
    type: 'select',
    format: 'badge',
    order: 5,
    align: 'center',
  })
  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  // ============ RELATIONS ============

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => TicketReply, (reply) => reply.ticket, { cascade: true })
  replies: TicketReply[];
}
