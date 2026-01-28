import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { AuditedEntity } from '../../../common/entities/audited.entity';
import { Plan } from '../../../plans/plan.entity';
import { Reward } from './reward.entity';

@Entity('plan_rewards')
@Unique(['planId', 'rewardId'])
export class PlanReward extends AuditedEntity {
    @Column({ type: 'uuid' })
    planId: string;

    @Column({ type: 'uuid' })
    rewardId: string;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Plan)
    @JoinColumn({ name: 'planId' })
    plan: Plan;

    @ManyToOne(() => Reward)
    @JoinColumn({ name: 'rewardId' })
    reward: Reward;
}
