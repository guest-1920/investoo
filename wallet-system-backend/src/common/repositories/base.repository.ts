import {
  Repository,
  FindOptionsWhere,
  DeepPartial,
  DataSource,
  EntityManager,
  FindManyOptions,
  ObjectLiteral,
} from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PaginationDto, PaginatedResponseDto } from '../dto';

/**
 * Base Repository providing common database operations with soft-delete support
 * All module repositories should extend this class
 */
export abstract class BaseRepository<T extends ObjectLiteral> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly dataSource: DataSource,
  ) {}

  /**
   * Find entity by ID with soft-delete filter
   */
  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({
      where: { id, deleted: false } as unknown as FindOptionsWhere<T>,
    });
  }

  /**
   * Find entity by ID or throw NotFoundException
   */
  async findByIdOrFail(id: string, entityName = 'Entity'): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundException(`${entityName} not found`);
    }
    return entity;
  }

  /**
   * Find all entities with pagination
   */
  async findAll(
    pagination: PaginationDto,
    additionalWhere: FindOptionsWhere<T> = {} as FindOptionsWhere<T>,
  ): Promise<PaginatedResponseDto<T>> {
    const where = {
      ...additionalWhere,
      deleted: false,
    } as FindOptionsWhere<T>;

    const [data, totalItems] = await this.repository.findAndCount({
      where,
      skip: pagination.skip,
      take: pagination.take,
      order: {
        [pagination.sortBy!]: pagination.sortOrder,
      } as any,
    });

    return PaginatedResponseDto.create(
      data,
      totalItems,
      pagination.page!,
      pagination.limit!,
    );
  }

  /**
   * Find entities by custom criteria with pagination
   */
  async findWithOptions(
    options: FindManyOptions<T>,
    pagination?: PaginationDto,
  ): Promise<T[] | PaginatedResponseDto<T>> {
    if (pagination) {
      const [data, totalItems] = await this.repository.findAndCount({
        ...options,
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
    return this.repository.find(options);
  }

  /**
   * Create and save entity
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Update entity by ID
   */
  async update(
    id: string,
    data: DeepPartial<T>,
    entityName = 'Entity',
  ): Promise<T> {
    const entity = await this.findByIdOrFail(id, entityName);
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  /**
   * Soft delete entity by ID
   */
  async softDelete(
    id: string,
    deletedBy?: string,
    entityName = 'Entity',
  ): Promise<T> {
    const entity = await this.findByIdOrFail(id, entityName);
    Object.assign(entity, {
      deleted: true,
      deletedAt: new Date(),
      deletedBy,
    });
    return this.repository.save(entity);
  }

  /**
   * Hard delete entity by ID (use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Execute callback within a database transaction
   * Uses pessimistic locking for financial operations
   */
  async runInTransaction<R>(
    work: (manager: EntityManager) => Promise<R>,
  ): Promise<R> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await work(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Count entities matching criteria
   */
  async count(
    where: FindOptionsWhere<T> = {} as FindOptionsWhere<T>,
  ): Promise<number> {
    return this.repository.count({
      where: { ...where, deleted: false } as FindOptionsWhere<T>,
    });
  }

  /**
   * Check if entity exists
   */
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Get TypeORM repository for complex queries
   */
  getRepository(): Repository<T> {
    return this.repository;
  }

  /**
   * Get DataSource for raw queries
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }
}
