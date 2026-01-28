import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AuditedEntity } from '../../../common/entities/audited.entity';
import { GridSchema, Field, Typeahead } from '../../../common/schema';
import { ReferralWindowProgress } from './referral-window-progress.entity';
import { Reward } from '../../rewards/entities/reward.entity';

@GridSchema('referral-windows')
@Entity('referral_windows')
export class ReferralWindow extends AuditedEntity {
    @Field({ label: 'Window Name', order: 1 })
    @Column()
    name: string;

    @Field({ label: 'Target Referrals', type: 'number', order: 2, align: 'center' })
    @Column({ type: 'integer' })
    targetReferralCount: number;

    @Field({ label: 'Duration (Days)', type: 'number', order: 3, align: 'center' })
    @Column({ type: 'integer' })
    windowDurationDays: number;

    @Field({ label: 'Min Purchase (USDT)', type: 'number', format: 'currency', order: 4, align: 'right' })
    @Column({ type: 'integer', default: 0 })
    minPurchaseAmount: number;

    @Field({ label: 'Reward', order: 8 })
    @Typeahead({
        endpoint: '/referrals/rewards/admin/all',
        displayField: 'name',
        valueField: 'id',
        label: 'Reward',
    })
    @Column({ nullable: true })
    rewardId: string;

    @Field({ label: 'Active', type: 'checkbox', format: 'badge', order: 5, align: 'center' })
    @Column({ default: true })
    isActive: boolean;

    @Field({ label: 'Valid From', type: 'date', order: 6, hidden: true })
    @Column({ type: 'date', nullable: true })
    validFrom: Date;

    @Field({ label: 'Valid Until', type: 'date', order: 7, hidden: true })
    @Column({ type: 'date', nullable: true })
    validUntil: Date;

    @OneToMany(() => ReferralWindowProgress, (p) => p.window)
    progress: ReferralWindowProgress[];

    @ManyToOne(() => Reward)
    @JoinColumn({ name: 'rewardId' })
    reward: Reward;
}

