import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketStatus } from '../support-ticket.entity';

export class UpdateStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;

  @IsString()
  @IsOptional()
  adminRemark?: string;

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsString()
  @IsOptional()
  updatedBy?: string;
}
