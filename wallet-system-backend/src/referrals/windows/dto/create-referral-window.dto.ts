import {
    IsString,
    IsNumber,
    IsOptional,
    IsInt,
    Min,
    IsBoolean,
    IsDate,
    IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AuditFieldsDto } from '../../../common/dto/audit-fields.dto';
import { FormSchema, Field, Typeahead } from '../../../common/schema';

@FormSchema('create-referral-window')
export class CreateReferralWindowDto extends AuditFieldsDto {
    @Field({ required: true, label: 'Window Name' })
    @IsString()
    @Transform(({ value }) => value?.trim())
    name: string;

    @Field({ required: true, label: 'Target Referrals', type: 'number' })
    @IsInt()
    @Min(1)
    targetReferralCount: number;

    @Field({ required: true, label: 'Duration (Days)', type: 'number' })
    @IsInt()
    @Min(1)
    windowDurationDays: number;

    @Field({ required: false, label: 'Min Purchase Amount (USDT)', type: 'number' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minPurchaseAmount?: number;

    @Field({ required: false, label: 'Active', type: 'checkbox' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @Field({ required: false, label: 'Reward' })
    @Typeahead({
        endpoint: '/referrals/rewards/admin/all',
        displayField: 'name',
        valueField: 'id',
        label: 'Reward',
    })
    @IsOptional()
    @IsUUID()
    rewardId?: string;

    @Field({ required: false, label: 'Valid From', type: 'date' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    validFrom?: Date;

    @Field({ required: false, label: 'Valid Until', type: 'date' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    validUntil?: Date;
}
