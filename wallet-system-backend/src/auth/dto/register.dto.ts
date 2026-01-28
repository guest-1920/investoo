import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { FormSchema, Field } from '../../common/schema';

@FormSchema('register')
export class RegisterDto {
  @Field({ required: true, label: 'Full Name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @Field({ required: true, label: 'Email', type: 'email' })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @Field({ required: true, label: 'Password', type: 'password' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:,.<>?/~`])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|;:,.<>?/~`]{8,}$/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @Field({ required: false, label: 'Referral Code' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  referralCode?: string;
}

