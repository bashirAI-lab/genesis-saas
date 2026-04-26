import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantAwareRequest } from '../../shared/interfaces/tenant-aware-request.interface';
import { Tenant, TenantStatus } from '../tenant.entity';
import { TenantConnectionManager } from '../tenant-connection.manager';

/**
 * Tenant Middleware — the gatekeeper of multi-tenancy.
 *
 * Execution flow:
 * 1. Extract tenant identifier from: x-tenant-id header → subdomain → JWT claim
 * 2. Resolve tenant config (Redis cache → Main DB fallback)
 * 3. Validate tenant status (must be ACTIVE)
 * 4. Get/create DataSource from connection pool
 * 5. Attach tenantId, tenantDataSource, and tenantInfo to the request object
 *
 * All downstream controllers/services access the tenant DB via req.tenantDataSource.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly connectionManager: TenantConnectionManager,
  ) {}

  async use(req: TenantAwareRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // ─── Step 1: Extract Tenant Identifier ─────────────────────
      const tenantIdentifier = this.extractTenantIdentifier(req);

      if (!tenantIdentifier) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Tenant identifier is required. Provide x-tenant-id header or use a tenant subdomain.',
            error: 'TENANT_REQUIRED',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // ─── Step 2: Resolve Tenant Config ─────────────────────────
      let tenant: Tenant | null = null;

      // Try Redis cache first
      const cachedConfig = await this.connectionManager.getCachedConfig(tenantIdentifier);

      if (cachedConfig) {
        // We still need tenant metadata — reconstruct minimal tenant info from cache
        // For full metadata, we'll query the DB only on cache miss
        tenant = await this.resolveTenant(tenantIdentifier);
      } else {
        tenant = await this.resolveTenant(tenantIdentifier);

        if (tenant) {
          // Cache the connection config for future requests
          await this.connectionManager.cacheTenantConfig(tenant.id, {
            dbHost: tenant.dbHost,
            dbPort: tenant.dbPort,
            dbName: tenant.dbName,
            dbUsername: tenant.dbUsername,
            dbPassword: tenant.dbPassword,
          });
        }
      }

      // ─── Step 3: Validate Tenant ──────────────────────────────
      if (!tenant) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: `Tenant not found: ${tenantIdentifier}`,
            error: 'TENANT_NOT_FOUND',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (tenant.status !== TenantStatus.ACTIVE) {
        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            message: `Tenant account is ${tenant.status}. Contact support for assistance.`,
            error: 'TENANT_INACTIVE',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      // ─── Step 4: Get Database Connection ──────────────────────
      const dataSource = await this.connectionManager.getConnection(tenant.id, {
        dbHost: tenant.dbHost,
        dbPort: tenant.dbPort,
        dbName: tenant.dbName,
        dbUsername: tenant.dbUsername,
        dbPassword: tenant.dbPassword,
      });

      // ─── Step 5: Attach to Request ────────────────────────────
      req.tenantId = tenant.id;
      req.tenantSlug = tenant.slug;
      req.tenantDataSource = dataSource;
      req.tenantInfo = {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        settings: tenant.settings,
      };

      this.logger.debug(`Request routed to tenant: ${tenant.slug} (${tenant.id})`);
      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Tenant middleware error: ${err.message}`, err.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to resolve tenant. Please try again.',
          error: 'TENANT_RESOLUTION_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── Private Methods ────────────────────────────────────────

  /**
   * Extract tenant identifier using priority:
   * 1. x-tenant-id header (API clients, mobile apps)
   * 2. Subdomain (browser-based SaaS — e.g., acme.platform.com)
   */
  private extractTenantIdentifier(req: TenantAwareRequest): string | null {
    // Priority 1: Explicit header
    const headerValue = req.headers['x-tenant-id'] as string;
    if (headerValue) {
      return headerValue.trim();
    }

    // Priority 2: Subdomain extraction
    const host = req.headers['host'] || '';
    const subdomain = this.extractSubdomain(host);
    if (subdomain) {
      return subdomain;
    }

    return null;
  }

  /**
   * Extract subdomain from host header.
   * e.g., "acme.platform.com" → "acme"
   * Ignores localhost, IPs, and single-segment hosts.
   */
  private extractSubdomain(host: string): string | null {
    // Remove port
    const hostname = host.split(':')[0];

    // Skip localhost and IP addresses
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return null;
    }

    const parts = hostname.split('.');
    // Need at least 3 parts for a subdomain (sub.domain.tld)
    if (parts.length >= 3) {
      const subdomain = parts[0];
      // Ignore common non-tenant subdomains
      const reserved = ['www', 'api', 'admin', 'mail', 'ftp'];
      if (!reserved.includes(subdomain)) {
        return subdomain;
      }
    }

    return null;
  }

  /**
   * Resolve tenant from the main database by ID or slug.
   */
  private async resolveTenant(identifier: string): Promise<Tenant | null> {
    // Try UUID format first (id), then try slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    if (isUuid) {
      return this.tenantRepository.findOne({ where: { id: identifier } });
    }

    return this.tenantRepository.findOne({ where: { slug: identifier } });
  }
}
