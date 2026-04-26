import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { TenantConnectionManager } from './tenant-connection.manager';
import { TenantMiddleware } from './middleware/tenant.middleware';
import { TenantProvisioningService } from './tenant-provisioning.service';

/**
 * Tenant Module — manages multi-tenancy at the platform level.
 *
 * Exports:
 * - TenantConnectionManager: used by other modules to register entities
 * - TenantService: used by auth and other core modules
 *
 * The TenantMiddleware is applied globally to all routes EXCEPT:
 * - /api/v1/tenants/* (platform-level tenant management)
 * - /api/v1/auth/login, /api/v1/auth/register (initial auth before tenant context)
 * - /health, /docs (utility endpoints)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantController],
  providers: [TenantService, TenantConnectionManager, TenantProvisioningService],
  exports: [TenantService, TenantConnectionManager],
})
export class TenantModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        // Platform-level routes (no tenant context needed)
        { path: 'tenants', method: RequestMethod.ALL },
        { path: 'tenants/(.*)', method: RequestMethod.ALL },
        // Health check
        { path: 'health', method: RequestMethod.GET },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
