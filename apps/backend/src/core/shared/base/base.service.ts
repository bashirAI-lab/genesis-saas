import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DataSource, Repository, ObjectType, FindOptionsWhere, ILike } from 'typeorm';
import { BaseEntity } from './base.entity';

export interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Abstract Base Service that all domain services inherit from.
 * Each method takes a DataSource parameter — this is the tenant's DB connection
 * provided by the middleware via the request object.
 *
 * Usage:
 *   @Injectable()
 *   export class PatientService extends BaseService<Patient> {
 *     constructor() { super(Patient); }
 *   }
 */
export abstract class BaseService<T extends BaseEntity> {
  protected readonly logger: Logger;

  /** Searchable columns for full-text search. Override in subclass. */
  protected searchableColumns: string[] = [];

  constructor(private readonly entityClass: ObjectType<T>) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Get a repository scoped to the tenant's DataSource.
   * This is the key method that makes multi-tenancy transparent to business logic.
   */
  protected getRepository(dataSource: DataSource): Repository<T> {
    return dataSource.getRepository(this.entityClass);
  }

  /**
   * Create a new entity.
   */
  async create(dataSource: DataSource, dto: Partial<T>): Promise<T> {
    const repo = this.getRepository(dataSource);
    const entity = repo.create(dto as any);
    const saved = await repo.save(entity as any);
    this.logger.log(`Created ${this.entityClass.name}: ${(saved as any).id}`);
    return saved as T;
  }

  /**
   * Find all entities with pagination, search, and sorting.
   */
  async findAll(
    dataSource: DataSource,
    options: PaginationOptions,
  ): Promise<PaginatedResult<T>> {
    const repo = this.getRepository(dataSource);
    const { page, limit, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const qb = repo.createQueryBuilder('entity');

    // Apply search across searchable columns
    if (search && this.searchableColumns.length > 0) {
      const searchConditions = this.searchableColumns
        .map((col) => `entity.${col} ILIKE :search`)
        .join(' OR ');
      qb.andWhere(`(${searchConditions})`, { search: `%${search}%` });
    }

    // Apply sorting
    const orderField = sortBy || 'createdAt';
    qb.orderBy(`entity.${orderField}`, sortOrder || 'DESC');

    // Apply pagination
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find one entity by ID.
   */
  async findOne(dataSource: DataSource, id: string): Promise<T> {
    const repo = this.getRepository(dataSource);
    const entity = await repo.findOne({ where: { id } as any });

    if (!entity) {
      throw new HttpException(
        `${this.entityClass.name} with ID "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return entity;
  }

  /**
   * Update an entity by ID.
   */
  async update(dataSource: DataSource, id: string, dto: Partial<T>): Promise<T> {
    const repo = this.getRepository(dataSource);
    const entity = await this.findOne(dataSource, id);

    Object.assign(entity, dto);
    const saved = await repo.save(entity as any);
    this.logger.log(`Updated ${this.entityClass.name}: ${id}`);
    return saved as T;
  }

  /**
   * Soft-delete an entity by ID.
   */
  async remove(dataSource: DataSource, id: string): Promise<void> {
    const repo = this.getRepository(dataSource);
    await this.findOne(dataSource, id); // Verify existence
    await repo.softDelete(id);
    this.logger.log(`Soft-deleted ${this.entityClass.name}: ${id}`);
  }

  /**
   * Count entities matching a condition.
   */
  async count(dataSource: DataSource, where?: FindOptionsWhere<T>): Promise<number> {
    const repo = this.getRepository(dataSource);
    return repo.count({ where: where as any });
  }
}
