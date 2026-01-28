import {
  Entity,
  Column,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../common/enums/roles.enum';
import { Exclude } from 'class-transformer';
import { AuditedEntity } from '../common/entities/audited.entity';
import { DecimalTransformer } from '../common/transformers';
import { WalletTransaction } from '../wallet/wallet-transaction.entity';
import { Recharge } from '../recharge/recharge.entity';
import { Withdrawal } from '../withdrawals/withdrawals.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { GridSchema, Field, Typeahead } from '../common/schema';

@GridSchema('users')
@Entity('users')
@Index('IDX_user_email', ['email'], { unique: true })
@Index('IDX_user_referral_code', ['referralCode'], { unique: true })
export class User extends AuditedEntity {
  @Field({ label: 'Name', order: 1 })
  @Column()
  name: string;

  @Field({ label: 'Email', type: 'email', order: 2 })
  @Column({ unique: true })
  email: string;

  @Field({ hidden: true })
  @Column({ select: false })
  @Exclude()
  password: string;

  @Field({
    label: 'Role',
    type: 'select',
    format: 'badge',
    order: 3,
    align: 'center',
  })
  @Column({
    type: 'varchar',
    default: Role.USER,
  })
  role: Role;

  @Field({
    label: 'Wallet Balance',
    type: 'number',
    format: 'currency',
    order: 4,
    align: 'right',
  })
  @Column({
    type: 'numeric',
    default: 0,
    transformer: DecimalTransformer,
  })
  walletBalance: number;

  @Field({ label: 'Referral Code', order: 5 })
  @Column({ unique: true })
  referralCode: string;

  @Field({ label: 'Referred By', order: 6 })
  @Typeahead({
    endpoint: '/users',
    displayField: 'name',
    valueField: 'id',
    label: 'Referred By',
  })
  @Column({ type: 'uuid', nullable: true })
  @Index('IDX_user_referred_by')
  referredBy: string;

  // ============ RELATIONS ============

  /** The user who referred this user */
  @ManyToOne(() => User, (user) => user.referrals, { nullable: true })
  @JoinColumn({ name: 'referredBy' })
  referrer: User;

  /** Users referred by this user */
  @OneToMany(() => User, (user) => user.referrer)
  referrals: User[];

  /** All wallet transactions for this user */
  @OneToMany(() => WalletTransaction, (tx) => tx.user)
  walletTransactions: WalletTransaction[];

  /** All recharge requests by this user */
  @OneToMany(() => Recharge, (recharge) => recharge.user)
  rechargeRequests: Recharge[];

  /** All withdrawal requests by this user */
  @OneToMany(() => Withdrawal, (withdrawal) => withdrawal.user)
  withdrawalRequests: Withdrawal[];

  /** All subscriptions purchased by this user */
  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];
}
