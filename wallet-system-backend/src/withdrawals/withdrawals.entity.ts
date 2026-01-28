import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AuditedEntity } from '../common/entities/audited.entity';
import { DecimalTransformer } from '../common/transformers';
import { User } from '../users/user.entity';
import { GridSchema, Field, Typeahead } from '../common/schema';

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@GridSchema('withdrawals')
@Entity('withdrawal_requests')
@Index('IDX_withdrawal_user_status', ['userId', 'status'])
export class Withdrawal extends AuditedEntity {
  @Field({ label: 'User', order: 0 })
  @Typeahead({
    endpoint: '/users',
    displayField: 'name',
    valueField: 'id',
    label: 'User',
  })
  @Column({ type: 'uuid' })
  @Index('IDX_withdrawal_user')
  userId: string;

  @Field({
    label: 'Amount',
    type: 'number',
    format: 'currency',
    order: 1,
    align: 'right',
  })
  @Column({
    type: 'numeric',
    transformer: DecimalTransformer,
  })
  amount: number;

  @Field({ label: 'Payout Method', hidden: true })
  @Column({ default: 'Blockchain' })
  payoutMethod: string;

  @Field({
    label: 'Fee',
    type: 'number',
    format: 'currency',
    order: 1.1,
    align: 'right',
  })
  @Column({
    type: 'numeric',
    transformer: DecimalTransformer,
    default: 0,
    nullable: true,
  })
  fee: number;

  @Field({
    label: 'Net Amount',
    type: 'number',
    format: 'currency',
    order: 1.2,
    align: 'right',
  })
  @Column({
    type: 'numeric',
    transformer: DecimalTransformer,
    nullable: true,
  })
  netAmount: number;

  @Field({ label: 'Blockchain Address', order: 2 })
  @Column()
  blockchainAddress: string;

  @Field({ label: 'Chain Name', order: 3 })
  @Column()
  chainName: string;

  @Field({
    label: 'Status',
    type: 'select',
    format: 'badge',
    order: 4,
    align: 'center',
  })
  @Column({
    type: 'enum',
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  @Index('IDX_withdrawal_status')
  status: WithdrawalStatus;

  @Field({ label: 'Admin Remark', order: 5 })
  @Column({ nullable: true })
  adminRemark: string;

  @Field({ label: 'Approved By', order: 6 })
  @Typeahead({
    endpoint: '/users',
    displayField: 'name',
    valueField: 'id',
    label: 'Approved By',
  })
  @Column({ type: 'uuid', nullable: true })
  approvedById: string;

  // ============ RELATIONS ============

  /** The user who created this withdrawal request */
  @ManyToOne(() => User, (user) => user.withdrawalRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
