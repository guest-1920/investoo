import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AuditedEntity } from '../../../common/entities/audited.entity';
import { GridSchema, Field, Typeahead } from '../../../common/schema';
import { User } from '../../../users/user.entity';
import { Reward } from '../../rewards/entities/reward.entity';
import { CustomerAddress } from '../../addresses/entities/customer-address.entity';

export enum FulfillmentStatus {
    PENDING_SELECTION = 'PENDING_SELECTION', // Awaiting user to select claim type
    PENDING = 'PENDING',       // Awaiting selection OR processing
    PROCESSING = 'PROCESSING', // Being prepared
    SHIPPED = 'SHIPPED',       // In transit
    DELIVERED = 'DELIVERED',   // Received / Credited
    FAILED = 'FAILED',         // Could not fulfill
}

@GridSchema('fulfillments')
@Entity('reward_fulfillments')
@Index('IDX_fulfillment_user', ['userId'])
@Index('IDX_fulfillment_status', ['status'])
export class RewardFulfillment extends AuditedEntity {
    @Field({ label: 'User', order: 1 })
    @Typeahead({
        endpoint: '/users',
        displayField: 'name',
        valueField: 'id',
        label: 'User',
    })
    @Column({ type: 'uuid' })
    userId: string;

    @Field({ label: 'Reward', order: 2 })
    @Typeahead({
        endpoint: '/referrals/rewards/admin/all',
        displayField: 'name',
        valueField: 'id',
        label: 'Reward',
    })
    @Column({ type: 'uuid' })
    rewardId: string;

    @Column({ type: 'uuid', nullable: true })
    addressId: string;

    @Column({ type: 'uuid', nullable: true })
    sourcePlanId: string;

    @Column({ type: 'uuid', nullable: true })
    sourceWindowProgressId: string;

    @Field({ label: 'Status', type: 'select', format: 'badge', order: 3, align: 'center' })
    @Column({
        type: 'enum',
        enum: FulfillmentStatus,
        default: FulfillmentStatus.PENDING,
    })
    status: FulfillmentStatus;

    @Field({ label: 'Tracking #', order: 4, hidden: true})
    @Column({ nullable: true })
    trackingNumber: string;

    @Field({ label: 'Admin Notes', order: 5, hidden: true })
    @Column({ type: 'text', nullable: true })
    adminNotes: string;

    @Column({ type: 'timestamptz', nullable: true })
    scheduledAt: Date;

    @Field({ label: 'Shipped At', type: 'date', order: 6 })
    @Column({ type: 'timestamptz', nullable: true })
    shippedAt: Date;

    @Field({ label: 'Delivered At', type: 'date', order: 7 })
    @Column({ type: 'timestamptz', nullable: true })
    deliveredAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Reward)
    @JoinColumn({ name: 'rewardId' })
    reward: Reward;

    @ManyToOne(() => CustomerAddress, { nullable: true })
    @JoinColumn({ name: 'addressId' })
    address: CustomerAddress;
}

