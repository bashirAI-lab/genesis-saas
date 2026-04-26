import { Request } from 'express';
import { DataSource } from 'typeorm';

/**
 * Extended Express Request carrying tenant-scoped context.
 * Attached by TenantMiddleware for every authenticated request.
 */
export interface TenantAwareRequest extends Request {
  /** Resolved tenant identifier */
  tenantId: string;

  /** Tenant slug (subdomain) */
  tenantSlug: string;

  /** Active TypeORM DataSource for this tenant's database */
  tenantDataSource: DataSource;

  /** Tenant metadata from the registry */
  tenantInfo: {
    id: string;
    name: string;
    slug: string;
    status: string;
    settings: Record<string, any>;
  };
}
