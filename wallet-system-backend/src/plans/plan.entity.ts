import { Entity, Column, Index, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AuditedEntity } from '../common/entities/audited.entity';
import { DecimalTransformer } from '../common/transformers';
import { Subscription } from '../subscriptions/subscription.entity';
import { Reward } from '../referrals/rewards/entities/reward.entity';
import { GridSchema, Field, Typeahead } from '../common/schema';

@GridSchema('plans')
@Entity('plans')
@Index('IDX_plan_status', ['status'])
export class Plan extends AuditedEntity {
  @Field({ label: 'Plan Name', order: 1 })
  @Column()
  name: string;

  @Field({
    label: 'Price',
    type: 'number',
    format: 'currency',
    order: 2,
    align: 'right',
  })
  @Column({
    type: 'numeric',
    transformer: DecimalTransformer,
  })
  price: number;

  @Field({
    label: 'Validity (Days)',
    type: 'number',
    order: 3,
    align: 'center',
  })
  @Column({ type: 'integer' })
  validity: number;

  @Field({ label: 'Description', order: 4, hidden: true })
  @Column({ nullable: true })
  description?: string;

  @Field({
    label: 'Status',
    type: 'select',
    format: 'badge',
    order: 5,
    align: 'center',
  })
  @Column({ default: 'ACTIVE' })
  status: 'ACTIVE' | 'INACTIVE';

  @Field({
    label: 'Daily Return',
    type: 'number',
    format: 'currency',
    order: 7,
    align: 'right',
  })
  @Column({
    type: 'numeric',
    default: 0,
    transformer: DecimalTransformer,
    comment: 'Amount credited daily to subscriber wallet',
  })
  dailyReturn: number;

  @Field({ label: 'Reward', order: 8 })
  @Typeahead({
    endpoint: '/referrals/rewards/admin/all',
    displayField: 'name',
    valueField: 'id',
    label: 'Reward',
  })
  @Column({ nullable: true })
  rewardId: string;

  // ============ RELATIONS ============

  /** All subscriptions for this plan */
  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];

  @ManyToOne(() => Reward)
  @JoinColumn({ name: 'rewardId' })
  reward: Reward;
}
