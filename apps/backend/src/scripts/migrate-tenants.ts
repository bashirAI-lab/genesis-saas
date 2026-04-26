import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { TenantService } from '../core/tenant/tenant.service';
import { TenantStatus } from '../core/tenant/tenant.entity';
import { TenantConnectionManager } from '../core/tenant/tenant-connection.manager';

/**
 * Global Migration Script
 * Iterates through all ACTIVE tenants and synchronizes/migrates their database schemas.
 * 
 * Usage: npx ts-node src/scripts/migrate-tenants.ts
 */
async function runMigrations() {
  const logger = new Logger('GlobalMigration');
  logger.log('Starting global tenant migration process...');

  // Create standalone NestJS application context (avoids starting HTTP server)
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const tenantService = app.get(TenantService);
  const connectionManager = app.get(TenantConnectionManager);

  // Fetch all active tenants
  const tenants = await tenantService.findAll({ status: TenantStatus.ACTIVE });
  logger.log(`Found ${tenants.length} active tenants. Applying schema updates...`);

  let successCount = 0;
  let failCount = 0;

  for (const tenant of tenants) {
    try {
      logger.log(`[Tenant: ${tenant.slug}] Establishing requested schema connection...`);
      const dataSource = await connectionManager.getConnection(tenant.id, {
        dbHost: tenant.dbHost,
        dbPort: tenant.dbPort,
        dbName: tenant.dbName,
        dbUsername: tenant.dbUsername,
        dbPassword: tenant.dbPassword,
      });

      // For production, use dataSource.runMigrations() instead of synchronize
      // We'll use synchronize here since we don't have explicit migration files generated yet.
      logger.log(`[Tenant: ${tenant.slug}] Synchronizing database schema...`);
      await dataSource.synchronize(false);
      
      logger.log(`[Tenant: ${tenant.slug}] ✅ Schema updated successfully.`);
      successCount++;
    } catch (error: any) {
      logger.error(`[Tenant: ${tenant.slug}] ❌ Migration failed: ${error.message}`);
      failCount++;
    }
  }

  logger.log(`Global Migration completed. Success: ${successCount}. Failed: ${failCount}.`);
  
  await app.close();
  process.exit(failCount > 0 ? 1 : 0);
}

runMigrations().catch(err => {
  console.error(err);
  process.exit(1);
});
