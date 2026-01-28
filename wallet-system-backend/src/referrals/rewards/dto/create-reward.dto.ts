import {
    IsString,
    IsNumber,
    IsOptional,
    IsInt,
    IsEnum,
    IsBoolean,
    Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AuditFieldsDto } from '../../../common/dto/audit-fields.dto';
import { FormSchema, Field } from '../../../common/schema';
import { RewardType } from '../entities/reward.entity';

@FormSchema('create-reward')
export class CreateRewardDto extends AuditFieldsDto {
    @Field({ required: true, label: 'Reward Name' })
    @IsString()
    @Transform(({ value }) => value?.trim())
    name: string;

    @Field({ required: false, label: 'Description', type: 'textarea' })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    description?: string;

    @Field({ required: true, label: 'Type', type: 'select' })
    @IsEnum(RewardType)
    type: RewardType;

    @Field({ required: true, label: 'Value (USDT)', type: 'number' })
    @IsNumber()
    @Min(0)
    value: number;

    @Field({ required: false, label: 'Image URL' })
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @Field({ required: false, label: 'Active', type: 'checkbox' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @Field({ required: false, label: 'Stock (leave empty for unlimited)', type: 'number' })
    @IsOptional()
    @IsInt()
    @Min(0)
    stock?: number;
}
