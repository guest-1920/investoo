import { IsNotEmpty, MinLength, IsString } from 'class-validator';
import { GridSchema, Field } from '../../common/schema';

@GridSchema('reset_password')
export class ResetPasswordDto {
  @Field({ label: 'Token', required: true, hidden: true })
  @IsString()
  @IsNotEmpty()
  token: string;

  @Field({ label: 'New Password', type: 'password', required: true })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
