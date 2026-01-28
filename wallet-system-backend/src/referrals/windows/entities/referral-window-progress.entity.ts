import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { AuditedEntity } from '../../../common/entities/audited.entity';
import { User } from '../../../users/user.entity';
import { ReferralWindow } from './referral-window.entity';

export enum ReferralWindowProgressStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    EXPIRED = 'EXPIRED',
    CLAIMED = 'CLAIMED',
}

@Entity('referral_window_progress')
// @Unique(['userId', 'windowId']) // Removed to allow re-entry after expiry
export class ReferralWindowProgress extends AuditedEntity {
    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'uuid' })
    windowId: string;

    @Column({ type: 'timestamptz' })
    windowStart: Date;

    @Column({ type: 'timestamptz' })
    windowEnd: Date;

    @Column({ type: 'integer', default: 0 })
    qualifiedReferrals: number;

    @Column({
        type: 'enum',
        enum: ReferralWindowProgressStatus,
        default: ReferralWindowProgressStatus.IN_PROGRESS,
    })
    status: ReferralWindowProgressStatus;

    @Column({ type: 'timestamptz', nullable: true })
    completedAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    claimedAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => ReferralWindow, (window) => window.progress)
    @JoinColumn({ name: 'windowId' })
    window: ReferralWindow;
}
