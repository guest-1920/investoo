import { Entity, Column } from 'typeorm';
import { AuditedEntity } from '../entities/audited.entity';
import { GridSchema, Field } from '../schema';

@GridSchema('settings')
@Entity('system_settings')
export class SystemSetting extends AuditedEntity {
  @Field({ label: 'Key', order: 1 })
  @Column({ unique: true })
  key: string;

  @Field({ label: 'Value (JSON)', order: 2 })
  @Column({ type: 'jsonb' })
  value: any;

  @Field({ label: 'Description', order: 3 })
  @Column({ nullable: true })
  description: string;

  @Field({
    label: 'Is Public',
    type: 'checkbox',
    format: 'boolean',
    order: 4,
    align: 'center',
  })
  @Column({ default: false })
  isPublic: boolean;
}
