import { Entity, Column, Index, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { AuditedEntity } from '../common/entities/audited.entity';
import { DecimalTransformer } from '../common/transformers';
import { User } from '../users/user.entity';
import { Subscription } from './subscription.entity';
import { Plan } from '../plans/plan.entity';
import { WalletTransaction } from '../wallet/wallet-transaction.entity';
import { GridSchema, Field, Typeahead } from '../common/schema';

@GridSchema('daily-return-logs')
@Entity('daily_return_logs')
@Unique('UQ_daily_return_subscription_date', [
  'subscriptionId',
  'creditedForDate',
])
@Index('IDX_daily_return_user', ['userId'])
@Index('IDX_daily_return_date', ['creditedForDate'])
export class DailyReturnLog extends AuditedEntity {
  @Field({ label: 'Subscription', order: 0 })
  @Typeahead({
    endpoint: '/subscriptions',
    displayField: 'id',
    valueField: 'id',
    label: 'Subscription',
  })
  @Column({ type: 'uuid' })
  subscriptionId: string;

  @Field({ label: 'User', order: 1 })
  @Typeahead({
    endpoint: '/users',
    displayField: 'name',
    valueField: 'id',
    label: 'User',
  })
  @Column({ type: 'uuid' })
  userId: string;

  @Field({ label: 'Plan', order: 2 })
  @Typeahead({
    endpoint: '/plans',
    displayField: 'name',
    valueField: 'id',
    label: 'Plan',
  })
  @Column({ type: 'uuid' })
  planId: string;

  @Field({
    label: 'Amount',
    type: 'number',
    format: 'currency',
    order: 3,
    align: 'right',
  })
  @Column({
    type: 'numeric',
    transformer: DecimalTransformer,
  })
  amount: number;

  @Field({
    label: 'Credited For Date',
    type: 'date',
    format: 'date',
    order: 4,
    align: 'center',
  })
  @Column({ type: 'date' })
  creditedForDate: Date;

  @Field({ label: 'Wallet Transaction', hidden: true })
  @Typeahead({
    endpoint: '/wallet/transactions',
    displayField: 'id',
    valueField: 'id',
    label: 'Wallet Transaction',
  })
  @Column({ type: 'uuid', nullable: true })
  walletTransactionId: string;

  // ============ RELATIONS ============

  /** The subscription this daily return belongs to */
  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  /** The user who received this daily return */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** The plan associated with this daily return */
  @ManyToOne(() => Plan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  /** The wallet transaction created for this return (optional) */
  @ManyToOne(() => WalletTransaction, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'walletTransactionId' })
  walletTransaction: WalletTransaction;
}
