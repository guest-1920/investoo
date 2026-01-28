import { IsOptional, IsUUID, IsDate, IsBoolean } from 'class-validator';
import { Exclude, Type } from 'class-transformer';
import { Field } from '../schema';

/**
 * Mixin class for audit fields that are injected by AuditInterceptor
 * These fields are whitelisted but excluded from responses
 *
 * Extend this class in DTOs that need to accept audit fields:
 * export class CreateSomethingDto extends AuditFieldsDto { ... }
 */
export class AuditFieldsDto {
  @Field({ hidden: true })
  @IsOptional()
  @IsUUID()
  id?: string;

  @Field({ hidden: true })
  @IsOptional()
  @IsUUID()
  @Exclude()
  createdBy?: string;

  @Field({ hidden: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAt?: Date;

  @Field({ hidden: true })
  @IsOptional()
  @IsUUID()
  @Exclude()
  updatedBy?: string;

  @Field({ hidden: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedAt?: Date;

  @Field({ hidden: true })
  @IsOptional()
  @IsBoolean()
  @Exclude()
  deleted?: boolean;

  @Field({ hidden: true })
  @IsOptional()
  @IsUUID()
  @Exclude()
  deletedBy?: string;

  @Field({ hidden: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @Exclude()
  deletedAt?: Date;
}
