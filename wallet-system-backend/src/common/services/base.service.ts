import {
  DeepPartial,
  FindOptionsWhere,
  EntityManager,
  ObjectLiteral,
} from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BaseRepository } from '../repositories';
import { PaginationDto, PaginatedResponseDto } from '../dto';

/**
 * Abstract base service providing common CRUD operations
 * All module services should extend this class for consistent behavior
 */
export abstract class BaseService<T extends ObjectLiteral> {
  protected abstract readonly entityName: string;

  constructor(protected readonly baseRepository: BaseRepository<T>) {}

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    return this.baseRepository.findById(id);
  }

  /**
   * Find entity by ID or throw NotFoundException
   */
  async findByIdOrFail(id: string): Promise<T> {
    return this.baseRepository.findByIdOrFail(id, this.entityName);
  }

  /**
   * Find all entities with pagination
   */
  async findAll(
    pagination: PaginationDto,
    where?: FindOptionsWhere<T>,
  ): Promise<PaginatedResponseDto<T>> {
    return this.baseRepository.findAll(pagination, where);
  }

  /**
   * Create new entity
   */
  async create(data: DeepPartial<T>): Promise<T> {
    return this.baseRepository.create(data);
  }

  /**
   * Update entity by ID
   */
  async update(id: string, data: DeepPartial<T>): Promise<T> {
    return this.baseRepository.update(id, data, this.entityName);
  }

  /**
   * Soft delete entity by ID
   */
  async delete(id: string, deletedBy?: string): Promise<T> {
    return this.baseRepository.softDelete(id, deletedBy, this.entityName);
  }

  /**
   * Execute callback within a database transaction
   */
  protected async runInTransaction<R>(
    work: (manager: EntityManager) => Promise<R>,
  ): Promise<R> {
    return this.baseRepository.runInTransaction(work);
  }

  /**
   * Check if entity exists by criteria
   */
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    return this.baseRepository.exists(where);
  }

  /**
   * Count entities matching criteria
   */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.baseRepository.count(where);
  }
}
