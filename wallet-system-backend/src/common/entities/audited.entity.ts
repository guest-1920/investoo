import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  BaseEntity,
  Column,
} from 'typeorm';
import { Exclude } from 'class-transformer';

/**
 * Base entity class that provides audit fields for all entities
 * Can be extended by other entities to include auditing functionality
 */
export abstract class AuditedEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Exclude()
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'uuid', nullable: true })
  @Exclude()
  updatedBy: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ default: false })
  @Exclude()
  deleted: boolean;

  @Column({ type: 'uuid', nullable: true })
  @Exclude()
  deletedBy: string;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  @Exclude()
  deletedAt: Date;
}
