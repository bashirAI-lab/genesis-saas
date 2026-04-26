import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import Redis from 'ioredis';

// Tenant DB entities
import { User } from '../rbac/entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { RolePermission } from '../rbac/entities/role-permission.entity';
import { UserRole } from '../rbac/entities/user-role.entity';
import { AuditLog } from '../shared/base/audit-log.entity';

interface TenantConnectionConfig {
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUsername: string;
  dbPassword: string;
}

interface PoolEntry {
  dataSource: DataSource;
  lastAccessed: number;
}

/**
 * Manages a dynamic pool of TypeORM DataSource connections — one per tenant.
 */
@Injectable()
export class TenantConnectionManager implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionManager.name);

  /** Active DataSource pool keyed by tenantId */
  private readonly pool = new Map<string, PoolEntry>();

  /** Redis client for caching tenant configs */
  private readonly redis: Redis;

  /** Eviction interval handle */
  private evictionInterval: NodeJS.Timeout;

  /** Base entities that every tenant DB gets (modules register their own) */
  private readonly baseTenantEntities: Function[] = [
    User,
    Role,
    Permission,
    RolePermission,
    UserRole,
    AuditLog,
  ];

  /** Additional entities registered by plugin modules */
  private readonly moduleEntities: Function[] = [];

  private readonly maxConnections: number;
  private readonly idleTimeoutMs: number;
  private readonly cacheTtlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    this.maxConnections = this.configService.get<number>('TENANT_MAX_CONNECTIONS', 50);
    this.idleTimeoutMs = this.configService.get<number>('TENANT_IDLE_TIMEOUT_MS', 1800000);
    this.cacheTtlSeconds = this.configService.get<number>('TENANT_CACHE_TTL_SECONDS', 300);

    // Initialize Redis client
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      keyPrefix: 'tenant:config:',
    });

    // Start idle connection eviction loop (every 60 seconds)
    this.evictionInterval = setInterval(() => this.evictIdleConnections(), 60_000);

    this.logger.log(
      `Connection Manager initialized — max: ${this.maxConnections}, idle timeout: ${this.idleTimeoutMs}ms`,
    );
  }

  /**
   * Register additional entities from plugin modules.
   * Called during module initialization (forRoot).
   */
  registerModuleEntities(entities: Function[]): void {
    this.moduleEntities.push(...entities);
    this.logger.log(`Registered ${entities.length} module entities. Total: ${this.moduleEntities.length}`);
  }

  /**
   * Get or create a DataSource for the given tenant.
   * This is the primary method called by the Tenant Middleware.
   */
  async getConnection(tenantId: string, config: TenantConnectionConfig): Promise<DataSource> {
    // Check pool first
    const existing = this.pool.get(tenantId);
    if (existing && existing.dataSource.isInitialized) {
      existing.lastAccessed = Date.now();
      return existing.dataSource;
    }

    // Enforce pool size limit
    if (this.pool.size >= this.maxConnections) {
      await this.evictOldestConnection();
    }

    // Create new DataSource
    const dataSource = await this.createDataSource(tenantId, config);
    this.pool.set(tenantId, { dataSource, lastAccessed: Date.now() });

    this.logger.log(`Connection created for tenant: ${tenantId} (pool size: ${this.pool.size})`);
    return dataSource;
  }

  /**
   * Cache tenant config in Redis to avoid main DB lookups.
   */
  async cacheTenantConfig(tenantId: string, config: TenantConnectionConfig): Promise<void> {
    await this.redis.setex(
      tenantId,
      this.cacheTtlSeconds,
      JSON.stringify(config),
    );
  }

  /**
   * Retrieve cached tenant config from Redis.
   * Returns null on cache miss.
   */
  async getCachedConfig(tenantId: string): Promise<TenantConnectionConfig | null> {
    const cached = await this.redis.get(tenantId);
    if (!cached) return null;
    return JSON.parse(cached) as TenantConnectionConfig;
  }

  /**
   * Remove a tenant's connection from the pool (e.g., when tenant is suspended).
   */
  async removeConnection(tenantId: string): Promise<void> {
    const entry = this.pool.get(tenantId);
    if (entry) {
      if (entry.dataSource.isInitialized) {
        await entry.dataSource.destroy();
      }
      this.pool.delete(tenantId);
      this.logger.log(`Connection removed for tenant: ${tenantId}`);
    }
    await this.redis.del(tenantId);
  }

  /**
   * Get connection pool stats (for monitoring/health checks).
   */
  getPoolStats(): { size: number; maxSize: number; tenantIds: string[] } {
    return {
      size: this.pool.size,
      maxSize: this.maxConnections,
      tenantIds: Array.from(this.pool.keys()),
    };
  }

  // ─── Private Methods ──────────────────────────────────────────

  private async createDataSource(
    tenantId: string,
    config: TenantConnectionConfig,
  ): Promise<DataSource> {
    const allEntities = [...this.baseTenantEntities, ...this.moduleEntities];

    const options: DataSourceOptions = {
      type: 'postgres',
      host: config.dbHost,
      port: config.dbPort,
      database: config.dbName,
      username: config.dbUsername,
      password: config.dbPassword,
      entities: allEntities,
      synchronize: false, // Use migrations in production
      logging: process.env.APP_ENV === 'development' ? ['error', 'warn'] : ['error'],
      extra: {
        max: 10, // Max connections per tenant pool
        idleTimeoutMillis: 30_000,
      },
    };

    const dataSource = new DataSource(options);
    await dataSource.initialize();
    return dataSource;
  }

  private async evictIdleConnections(): Promise<void> {
    const now = Date.now();
    const toEvict: string[] = [];

    for (const [tenantId, entry] of this.pool.entries()) {
      if (now - entry.lastAccessed > this.idleTimeoutMs) {
        toEvict.push(tenantId);
      }
    }

    for (const tenantId of toEvict) {
      await this.removeConnection(tenantId);
    }

    if (toEvict.length > 0) {
      this.logger.log(`Evicted ${toEvict.length} idle connections. Pool size: ${this.pool.size}`);
    }
  }

  private async evictOldestConnection(): Promise<void> {
    let oldestId: string | null = null;
    let oldestTime = Infinity;

    for (const [tenantId, entry] of this.pool.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestId = tenantId;
      }
    }

    if (oldestId) {
      await this.removeConnection(oldestId);
      this.logger.warn(`Evicted oldest connection (tenant: ${oldestId}) to make room`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    clearInterval(this.evictionInterval);

    // Close all connections gracefully
    const closePromises = Array.from(this.pool.entries()).map(async ([tenantId, entry]) => {
      if (entry.dataSource.isInitialized) {
        await entry.dataSource.destroy();
        this.logger.log(`Connection closed for tenant: ${tenantId}`);
      }
    });

    await Promise.all(closePromises);
    this.pool.clear();
    await this.redis.quit();
    this.logger.log('All tenant connections closed');
  }
}
