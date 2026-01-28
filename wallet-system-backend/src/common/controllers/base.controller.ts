import {
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BaseService } from '../services';
import { PaginationDto, PaginatedResponseDto } from '../dto';
import type { ObjectLiteral, DeepPartial } from 'typeorm';

/**
 * Abstract base controller providing common CRUD endpoints
 * Extend this class and add route decorators for consistent API behavior
 *
 * Usage:
 * @Controller('resource')
 * export class ResourceController extends BaseController<Resource> {
 *   constructor(service: ResourceService) {
 *     super(service);
 *   }
 * }
 */
export abstract class BaseController<T extends ObjectLiteral> {
  constructor(protected readonly service: BaseService<T>) {}

  /**
   * GET /
   * Find all with pagination
   */
  async findAll(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<T>> {
    return this.service.findAll(pagination);
  }

  /**
   * GET /:id
   * Find by ID
   */
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<T> {
    return this.service.findByIdOrFail(id);
  }

  /**
   * POST /
   * Create new entity
   */
  async create(@Body() data: DeepPartial<T>): Promise<T> {
    return this.service.create(data);
  }

  /**
   * PATCH /:id
   * Update entity
   */
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: DeepPartial<T>,
  ): Promise<T> {
    return this.service.update(id, data);
  }

  /**
   * DELETE /:id
   * Soft delete entity
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.service.delete(id);
  }
}
