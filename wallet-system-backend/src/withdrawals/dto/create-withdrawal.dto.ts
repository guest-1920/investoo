import { IsNumber, Min, IsString } from 'class-validator';
import { AuditFieldsDto } from '../../common/dto/audit-fields.dto';
import { FormSchema, Field } from '../../common/schema';

@FormSchema('create-withdrawal')
export class CreateWithdrawalDto extends AuditFieldsDto {
  @Field({ required: true, label: 'Amount', type: 'number' })
  @IsNumber()
  @Min(1)
  amount: number;

  @Field({ required: true, label: 'Blockchain Address' })
  @IsString()
  blockchainAddress: string;

  @Field({ required: true, label: 'Chain Name' })
  @IsString()
  chainName: string;
}
