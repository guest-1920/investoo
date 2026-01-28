import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './plan.entity';
import { PaginationDto, PaginatedResponseDto } from '../common/dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly repo: Repository<Plan>,
  ) { }

  /**
   * ADMIN: Create a new plan
   */
  create(data: Partial<Plan>): Promise<Plan> {
    const plan = this.repo.create(data);
    return this.repo.save(plan);
  }

  /**
   * PUBLIC: Find all active plans
   */
  async findAllActive(): Promise<Plan[]> {
    return this.repo.find({
      where: { status: 'ACTIVE', deleted: false },
      relations: ['reward'],
      order: { price: 'ASC' },
    });
  }

  /**
   * ADMIN: Find all plans with pagination
   */
  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Plan>> {
    const [data, totalItems] = await this.repo.findAndCount({
      where: { deleted: false },
      relations: ['reward'],
      order: { [pagination.sortBy!]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.take,
    });

    return PaginatedResponseDto.create(
      data,
      totalItems,
      pagination.page!,
      pagination.limit!,
    );
  }

  /**
   * ADMIN: Update a plan
   */
  async update(id: string, data: Partial<Plan>): Promise<Plan> {
    const plan = await this.repo.findOne({ where: { id, deleted: false } });
    if (!plan) throw new NotFoundException('Plan not found');

    Object.assign(plan, data);
    return this.repo.save(plan);
  }

  /**
   * ADMIN: Deactivate a plan (soft disable)
   */
  async deactivate(id: string): Promise<Plan> {
    return this.update(id, { status: 'INACTIVE' });
  }

  /**
   * ADMIN: Activate a plan
   */
  async activate(id: string): Promise<Plan> {
    return this.update(id, { status: 'ACTIVE' });
  }

  /**
   * Find plan by ID
   */
  async findById(id: string): Promise<Plan | null> {
    return this.repo.findOne({
      where: { id, deleted: false },
    });
  }

  /**
   * Find plan by ID or fail
   */
  async findByIdOrFail(id: string): Promise<Plan> {
    const plan = await this.findById(id);
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }
  /**
   * ADMIN: Delete a plan (soft delete)
   */
  async remove(id: string): Promise<void> {
    const plan = await this.findByIdOrFail(id);
    plan.deleted = true;
    plan.deletedAt = new Date();
    plan.status = 'INACTIVE'; // Ensure it's also inactive
    await this.repo.save(plan);
  }
}
