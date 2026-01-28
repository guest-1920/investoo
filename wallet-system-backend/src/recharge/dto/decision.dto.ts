import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RechargeStatus } from '../recharge.entity';
import { AuditFieldsDto } from '../../common/dto/audit-fields.dto';
import { FormSchema, Field } from '../../common/schema';

@FormSchema('recharge-decision')
export class RechargeDecisionDto extends AuditFieldsDto {
  @Field({ required: true, label: 'Status', type: 'select' })
  @IsEnum(RechargeStatus)
  status: RechargeStatus; // APPROVED / REJECTED

  @Field({ required: false, label: 'Admin Remark', type: 'textarea' })
  @IsOptional()
  @IsString()
  adminRemark?: string;

  @Field({ required: false, label: 'Transaction ID', type: 'text' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
