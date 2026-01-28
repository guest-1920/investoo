import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WithdrawalStatus } from '../withdrawals.entity';
import { AuditFieldsDto } from '../../common/dto/audit-fields.dto';
import { FormSchema, Field } from '../../common/schema';

@FormSchema('withdrawal-decision')
export class WithdrawalDecisionDto extends AuditFieldsDto {
  @Field({ required: true, label: 'Status', type: 'select' })
  @IsEnum(WithdrawalStatus)
  status: WithdrawalStatus; // APPROVED / REJECTED

  @Field({ required: false, label: 'Admin Remark', type: 'textarea' })
  @IsOptional()
  @IsString()
  adminRemark?: string;
}
