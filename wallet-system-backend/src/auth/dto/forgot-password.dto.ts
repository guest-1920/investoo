import { IsEmail, IsNotEmpty } from 'class-validator';
import { GridSchema, Field } from '../../common/schema';

@GridSchema('forgot_password')
export class ForgotPasswordDto {
  @Field({ label: 'Email', type: 'email', required: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
