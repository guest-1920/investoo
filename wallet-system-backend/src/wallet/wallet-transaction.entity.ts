import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AuditedEntity } from '../common/entities/audited.entity';
import {
  WalletTransactionType,
  WalletTransactionSource,
  WalletTransactionStatus,
} from './enums/wallet.enums';
import { DecimalTransformer } from '../common/transformers';
import { User } from '../users/user.entity';
import { GridSchema, Field, Typeahead } from '../common/schema';

@GridSchema('wallet-transactions')
@Entity('wallet_transactions')
@Index('IDX_wallet_tx_user_status', ['userId', 'status'])
@Index('IDX_wallet_tx_user_created', ['userId', 'createdAt'])
export class WalletTransaction extends AuditedEntity {
  @Field({ label: 'User', order: 0 })
  @Typeahead({
    endpoint: '/users',
    displayField: 'name',
    valueField: 'id',
    label: 'User',
  })
  @Column({ type: 'uuid' })
  @Index('IDX_wallet_tx_user')
  userId: string;

  @Field({
    label: 'Type',
    type: 'select',
    format: 'badge',
    order: 1,
    align: 'center',
  })
  @Column({
    type: 'enum',
    enum: WalletTransactionType,
  })
  type: WalletTransactionType;

  @Field({
    label: 'Amount',
    type: 'number',
    format: 'currency',
    order: 2,
    align: 'right',
  })
  @Column({
    type: 'numeric',
    transformer: DecimalTransformer,
  })
  amount: number;

  @Field({
    label: 'Source',
    type: 'select',
    format: 'badge',
    order: 3,
    align: 'center',
  })
  @Column({
    type: 'enum',
    enum: WalletTransactionSource,
  })
  @Index('IDX_wallet_tx_source')
  source: WalletTransactionSource;

  @Field({ label: 'Reference ID', hidden: true })
  @Column({ type: 'uuid', nullable: true })
  referenceId: string;

  @Field({
    label: 'Status',
    type: 'select',
    format: 'badge',
    order: 4,
    align: 'center',
  })
  @Column({
    type: 'enum',
    enum: WalletTransactionStatus,
    default: WalletTransactionStatus.PENDING,
  })
  status: WalletTransactionStatus;

  // ============ RELATIONS ============

  /** The user who owns this transaction */
  @ManyToOne(() => User, (user) => user.walletTransactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
