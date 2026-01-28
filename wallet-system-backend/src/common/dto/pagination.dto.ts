import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  search?: string;

  get skip(): number {
    return (this.page! - 1) * this.limit!;
  }

  get take(): number {
    return this.limit!;
  }

  @IsOptional()
  @IsString()
  filters?: string;

  @IsOptional()
  @IsString()
  status?: string;

  get parsedFilters(): Record<string, any> {
    if (!this.filters) return {};
    try {
      return JSON.parse(this.filters);
    } catch {
      return {};
    }
  }
}
