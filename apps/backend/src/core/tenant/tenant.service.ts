import { Injectable, Logger, HttpException, HttpStatus, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Tenant, TenantStatus } from './tenant.entity';
import { TenantConnectionManager } from './tenant-connection.manager';

export interface CreateTenantDto {
  name: string;
  slug: string;
  adminEmail: string;
  dbHost?: string;
  dbPort?: number;
  dbName?: string;
  dbUsername?: string;
  dbPassword?: string;
  subscriptionPlan?: string;
  settings?: Record<string, any>;
}

export interface UpdateTenantDto {
  name?: string;
  status?: TenantStatus;
  settings?: Record<string, any>;
  activeModules?: string[];
  subscriptionPlan?: string;
  subscriptionExpiresAt?: Date;
  maxUsers?: number;
}

/**
 * Service for managing tenant lifecycle — CRUD, provisioning, and status management.
 * Operates on the MAIN database (tenant registry).
 */
@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly connectionManager: TenantConnectionManager,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new tenant and provision its database.
   * In production, this would also trigger a DB creation script.
   */
  async create(dto: CreateTenantDto): Promise<Tenant> {
    // Validate slug uniqueness
    const existing = await this.tenantRepository.findOne({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(
        `Tenant with slug "${dto.slug}" already exists`,
      );
    }

    const tenant = this.tenantRepository.create({
      name: dto.name,
      slug: dto.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      adminEmail: dto.adminEmail,
      dbHost: dto.dbHost || process.env.MAIN_DB_HOST || 'localhost',
      dbPort: dto.dbPort || parseInt(process.env.MAIN_DB_PORT || '5432', 10),
      dbName: dto.dbName || `saas_tenant_${dto.slug.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      dbUsername: dto.dbUsername || process.env.MAIN_DB_USERNAME || 'postgres',
      dbPassword: dto.dbPassword || process.env.MAIN_DB_PASSWORD || 'postgres',
      subscriptionPlan: dto.subscriptionPlan || 'free',
      settings: dto.settings || {},
      status: TenantStatus.PENDING,
    });

    const saved = await this.tenantRepository.save(tenant);
    this.logger.log(`Tenant created: ${saved.slug} (${saved.id})`);

    // Fire off async provisioning chain
    this.eventEmitter.emit('tenant.created', saved);

    return saved;
  }

  /**
   * Activate a tenant (after provisioning is complete).
   */
  async activate(tenantId: string): Promise<Tenant> {
    const tenant = await this.findByIdOrThrow(tenantId);
    tenant.status = TenantStatus.ACTIVE;
    const saved = await this.tenantRepository.save(tenant);
    this.logger.log(`Tenant activated: ${saved.slug}`);
    return saved;
  }

  /**
   * Suspend a tenant and close its database connection.
   */
  async suspend(tenantId: string): Promise<Tenant> {
    const tenant = await this.findByIdOrThrow(tenantId);
    tenant.status = TenantStatus.SUSPENDED;
    const saved = await this.tenantRepository.save(tenant);

    // Evict connection from pool
    await this.connectionManager.removeConnection(tenantId);
    this.logger.warn(`Tenant suspended: ${saved.slug}`);
    return saved;
  }

  /**
   * Update tenant metadata.
   */
  async update(tenantId: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findByIdOrThrow(tenantId);
    Object.assign(tenant, dto);
    return this.tenantRepository.save(tenant);
  }

  /**
   * Find a tenant by ID.
   */
  async findById(tenantId: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { id: tenantId } });
  }

  /**
   * Find a tenant by slug.
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { slug } });
  }

  /**
   * List all tenants with optional filtering.
   */
  async findAll(filters?: {
    status?: TenantStatus;
    plan?: string;
  }): Promise<Tenant[]> {
    const qb = this.tenantRepository.createQueryBuilder('tenant');

    if (filters?.status) {
      qb.andWhere('tenant.status = :status', { status: filters.status });
    }
    if (filters?.plan) {
      qb.andWhere('tenant.subscription_plan = :plan', { plan: filters.plan });
    }

    return qb.orderBy('tenant.created_at', 'DESC').getMany();
  }

  /**
   * Get connection pool statistics.
   */
  getPoolStats() {
    return this.connectionManager.getPoolStats();
  }

  /**
   * Soft-delete a tenant.
   */
  async remove(tenantId: string): Promise<void> {
    await this.connectionManager.removeConnection(tenantId);
    await this.tenantRepository.softDelete(tenantId);
    this.logger.warn(`Tenant soft-deleted: ${tenantId}`);
  }

  // ─── Private ──────────────────────────────────────────────

  private async findByIdOrThrow(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new HttpException(`Tenant not found: ${tenantId}`, HttpStatus.NOT_FOUND);
    }
    return tenant;
  }
}
