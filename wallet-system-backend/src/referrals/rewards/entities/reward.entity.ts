import { Entity, Column } from 'typeorm';
import { AuditedEntity } from '../../../common/entities/audited.entity';
import { GridSchema, Field } from '../../../common/schema';

export enum RewardType {
    DIGITAL = 'DIGITAL',   // Wallet credit, bonus, etc.
    PHYSICAL = 'PHYSICAL', // Tangible goods delivered
}

// Custom transformer for numeric/decimal columns to ensure they are read as numbers
export class DecimalTransformer {
    to(data: number): number {
        return data;
    }
    from(data: string): number {
        return parseFloat(data);
    }
}

@GridSchema('rewards')
@Entity('rewards')
export class Reward extends AuditedEntity {
    @Field({ label: 'Reward Name', order: 1 })
    @Column()
    name: string;

    @Field({ label: 'Description', order: 2, hidden: true })
    @Column({ type: 'text', nullable: true })
    description: string;

    @Field({ label: 'Type', type: 'select', format: 'badge', order: 3, align: 'center' })
    @Column({ type: 'enum', enum: RewardType })
    type: RewardType;

    @Field({ label: 'Value (USDT)', type: 'number', format: 'currency', order: 4, align: 'right' })
    @Column({ type: 'numeric', transformer: new DecimalTransformer() })
    value: number;

    @Field({ label: 'Image', order: 5, hidden: true })
    @Column({ nullable: true })
    imageUrl: string;

    @Field({ label: 'Active', type: 'checkbox', format: 'badge', order: 6, align: 'center' })
    @Column({ default: true })
    isActive: boolean;

    @Field({ label: 'Stock', type: 'number', order: 7, align: 'center' })
    @Column({ type: 'integer', nullable: true })
    stock: number; // NULL for unlimited

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;
}

