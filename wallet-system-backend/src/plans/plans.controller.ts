import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
  Delete,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationDto } from '../common/dto';
import { SkipThrottle } from '@nestjs/throttler';
import { Role } from '../common/enums/roles.enum';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  /**
   * POST /plans
   * ADMIN: Create a new plan
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  /**
   * PATCH /plans/:id
   * ADMIN: Update a plan
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  /**
   * PATCH /plans/:id/activate
   * ADMIN: Activate a plan
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.activate(id);
  }

  /**
   * PATCH /plans/:id/deactivate
   * ADMIN: Deactivate a plan
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.deactivate(id);
  }

  /**
   * DELETE /plans/:id
   * ADMIN: Delete (soft) a plan
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.remove(id);
  }

  /**
   * GET /plans
   * PUBLIC: View active plans
   */
  @Public()
  @SkipThrottle()
  @Get()
  findActivePlans() {
    return this.plansService.findAllActive();
  }

  /**
   * GET /plans/:id
   * PUBLIC: Get single plan
   */
  @Public()
  @SkipThrottle()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.findByIdOrFail(id);
  }

  /**
   * GET /plans/admin/all
   * ADMIN: View all plans with pagination
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/all')
  findAllPlans(@Query() pagination: PaginationDto) {
    return this.plansService.findAll(pagination);
  }
}
