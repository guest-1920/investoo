import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AuditedEntity } from '../../../common/entities/audited.entity';
import { User } from '../../../users/user.entity';

@Entity('customer_addresses')
@Index('IDX_address_user', ['userId'])
export class CustomerAddress extends AuditedEntity {
    @Column({ type: 'uuid' })
    userId: string;

    @Column({ default: 'Home' })
    label: string;

    @Column()
    fullName: string;

    @Column()
    phone: string;

    @Column()
    addressLine1: string;

    @Column({ nullable: true })
    addressLine2: string;

    @Column()
    city: string;

    @Column()
    state: string;

    @Column()
    postalCode: string;

    @Column({ default: 'India' })
    country: string;

    @Column({ default: false })
    isDefault: boolean;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;
}
