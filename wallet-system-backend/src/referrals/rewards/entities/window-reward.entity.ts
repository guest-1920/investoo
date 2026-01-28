import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { AuditedEntity } from '../../../common/entities/audited.entity';
import { ReferralWindow } from '../../windows/entities/referral-window.entity';
import { Reward } from './reward.entity';

@Entity('window_rewards')
@Unique(['windowId', 'rewardId'])
export class WindowReward extends AuditedEntity {
    @Column({ type: 'uuid' })
    windowId: string;

    @Column({ type: 'uuid' })
    rewardId: string;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => ReferralWindow)
    @JoinColumn({ name: 'windowId' })
    window: ReferralWindow;

    @ManyToOne(() => Reward)
    @JoinColumn({ name: 'rewardId' })
    reward: Reward;
}
