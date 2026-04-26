import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Tenant } from './tenant.entity';
import { TenantConnectionManager } from './tenant-connection.manager';
import { RbacService } from '../rbac/rbac.service';

/**
 * Listens for Tenant lifecycle events and automatically provisions
 * or tears down infrastructure (e.g. database setup).
 */
@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(
    private readonly connectionManager: TenantConnectionManager,
    private readonly rbacService: RbacService,
  ) {}

  @OnEvent('tenant.created')
  async handleTenantCreated(tenant: Tenant) {
    this.logger.log(`[Provisioning] Started for new tenant: ${tenant.slug}`);

    try {
      // 1. Establish connection (This also runs initial TypeORM tree construction)
      const dataSource = await this.connectionManager.getConnection(tenant.id, {
        dbHost: tenant.dbHost,
        dbPort: tenant.dbPort,
        dbName: tenant.dbName,
        dbUsername: tenant.dbUsername,
        dbPassword: tenant.dbPassword,
      });

      // 2. Synchronize Schema Automatically
      this.logger.log(`[Provisioning: ${tenant.slug}] Synchronizing schema...`);
      await dataSource.synchronize(false);
      
      // 3. Seed Basic Rules
      this.logger.log(`[Provisioning: ${tenant.slug}] Seeding base RBAC...`);
      await this.rbacService.seedDefaultRolesAndPermissions(dataSource);

      this.logger.log(`[Provisioning] Successfully finished for ${tenant.slug}`);
    } catch (err: any) {
      this.logger.error(`[Provisioning] Failed for ${tenant.slug}: ${err.message}`, err.stack);
      // In a real system, you'd trigger a generic rollback or flag the Tenant as 'FAILED_PROVISION'
    }
  }
}
