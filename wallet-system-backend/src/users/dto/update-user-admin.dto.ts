import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { FormSchema, Field } from '../../common/schema';
import { Role } from '../../common/enums/roles.enum';
import { AuditFieldsDto } from '../../common/dto/audit-fields.dto';

@FormSchema('update-user-admin')
export class UpdateUserAdminDto extends AuditFieldsDto {
  @Field({ required: false, label: 'Full Name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @Field({ required: false, label: 'Email', type: 'email' })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @Field({ required: false, label: 'Role', type: 'select' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
