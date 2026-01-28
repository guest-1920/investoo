import {
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsInt,
  Max,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AuditFieldsDto } from '../../common/dto/audit-fields.dto';
import { FormSchema, Field, Typeahead } from '../../common/schema';

@FormSchema('create-plan')
export class CreatePlanDto extends AuditFieldsDto {
  @Field({ required: true, label: 'Plan Name' })
  @IsString()
  @Transform(({ value }) => value?.trim())
  name: string;

  @Field({ required: false, label: 'Description', type: 'textarea' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;

  @Field({ required: true, label: 'Price', type: 'number' })
  @IsNumber()
  @Min(0)
  price: number;

  @Field({ required: true, label: 'Validity (Days)', type: 'number' })
  @IsInt()
  @Min(1)
  @Max(365)
  validity: number;

  @Field({ required: false, label: 'Daily Return', type: 'number' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyReturn?: number;

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
}
