import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AuditedEntity } from '../common/entities/audited.entity';
import { User } from '../users/user.entity';
import { Plan } from '../plans/plan.entity';
import { GridSchema, Field, Typeahead } from '../common/schema';

@GridSchema('subscriptions')
@Entity('subscriptions')
@Index('IDX_subscription_user_active', ['userId', 'isActive'])
@Index('IDX_subscription_end_date', ['endDate', 'isActive'])
export class Subscription extends AuditedEntity {
  @Field({ label: 'User', order: 0 })
  @Typeahead({
    endpoint: '/users',
    displayField: 'name',
    valueField: 'id',
    label: 'User',
  })
  @Column({ type: 'uuid' })
  @Index('IDX_subscription_user')
  userId: string;

  @Field({ label: 'Plan', order: 1 })
  @Typeahead({
    endpoint: '/plans',
    displayField: 'name',
    valueField: 'id',
    label: 'Plan',
  })
  @Column({ type: 'uuid' })
  planId: string;

  @Field({
    label: 'Start Date',
    type: 'date',
    format: 'datetime',
    order: 2,
    align: 'center',
  })
  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Field({
    label: 'End Date',
    type: 'date',
    format: 'datetime',
    order: 3,
    align: 'center',
  })
  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Field({
    label: 'Active',
    type: 'checkbox',
    format: 'boolean',
    order: 4,
    align: 'center',
  })
  @Column({ default: true })
  isActive: boolean;

  // ============ RELATIONS ============

  /** The user who purchased this subscription */
  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** The plan associated with this subscription */
  @ManyToOne(() => Plan, (plan) => plan.subscriptions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;
}
