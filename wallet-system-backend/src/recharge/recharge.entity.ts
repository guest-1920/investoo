import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AuditedEntity } from '../common/entities/audited.entity';
import { DecimalTransformer } from '../common/transformers';
import { User } from '../users/user.entity';
import { GridSchema, Field, Typeahead } from '../common/schema';

export enum RechargeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@GridSchema('recharges')
@Entity('recharge_requests')
@Index('IDX_recharge_user_status', ['userId', 'status'])
export class Recharge extends AuditedEntity {
  @Field({ label: 'User', order: 0 })
  @Typeahead({
    endpoint: '/users',
    displayField: 'name',
    valueField: 'id',
    label: 'User',
  })
  @Column({ type: 'uuid' })
  @Index('IDX_recharge_user')
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

  @Field({ label: 'Payment Method', hidden: true })
  @Column({ default: 'Blockchain' })
  paymentMethod: string;

  @Field({ label: 'Blockchain Address', order: 2, hidden: true })
  @Column({ nullable: true })
  blockchainAddress: string;

  @Field({ label: 'Chain Name', order: 3 })
  @Column({ nullable: true })
  chainName: string;

  @Field({ label: 'Transaction ID', order: 4 })
  @Column({ unique: true, nullable: true })
  transactionId: string;

  @Field({ label: 'Proof Key', hidden: true })
  @Column()
  proofKey: string;

  @Field({ label: 'Approved By', order: 5 })
  @Typeahead({
    endpoint: '/users',
    displayField: 'name',
    valueField: 'id',
    label: 'Approved By',
  })
  @Column({ type: 'uuid', nullable: true })
  approvedById: string;

  @Field({
    label: 'Status',
    type: 'select',
    format: 'badge',
    order: 3,
    align: 'center',
  })
  @Column({
    type: 'enum',
    enum: RechargeStatus,
    default: RechargeStatus.PENDING,
  })
  @Index('IDX_recharge_status')
  status: RechargeStatus;

  @Field({ label: 'Admin Remark', order: 4 })
  @Column({ nullable: true })
  adminRemark: string;

  // ============ RELATIONS ============

  /** The user who created this recharge request */
  @ManyToOne(() => User, (user) => user.rechargeRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
