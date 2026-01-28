import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanDto } from './create-plan.dto';
import { FormSchema } from '../../common/schema';

@FormSchema('update-plan')
export class UpdatePlanDto extends PartialType(CreatePlanDto) {}
