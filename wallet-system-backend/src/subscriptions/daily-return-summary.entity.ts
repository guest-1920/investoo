import { Entity, Column, Index, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { AuditedEntity } from '../common/entities/audited.entity';
import { DecimalTransformer } from '../common/transformers';
import { User } from '../users/user.entity';
import { PeriodType } from './enums';

/**
 * Pre-aggregated daily return summaries for efficient graph queries.
 * Maintained incrementally when daily returns are credited.
 */
@Entity('daily_return_summary')
@Unique('UQ_summary_user_period', ['userId', 'periodType', 'periodKey'])
@Index('IDX_summary_user_period_type', ['userId', 'periodType'])
export class DailyReturnSummary extends AuditedEntity {
  @Column({ type: 'uuid' })
  userId: string;

  /**
   * Aggregation level: DAY, WEEK, or MONTH
   */
  @Column({ type: 'enum', enum: PeriodType })
  periodType: PeriodType;

  /**
   * Period identifier:
   * - day: '2026-01-20'
   * - week: '2026-W03'
   * - month: '2026-01'
   */
  @Column({ type: 'varchar', length: 20 })
  periodKey: string;

  /**
   * Sum of all daily returns in this period
   */
  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    transformer: DecimalTransformer,
    default: 0,
  })
  totalAmount: number;

  /**
   * Count of daily return logs in this period
   */
  @Column({ type: 'int', default: 0 })
  count: number;

  // ============ RELATIONS ============

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
