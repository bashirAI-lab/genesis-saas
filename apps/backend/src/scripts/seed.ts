import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { TenantService } from '../core/tenant/tenant.service';
import { TenantConnectionManager } from '../core/tenant/tenant-connection.manager';
import { RbacService } from '../core/rbac/rbac.service';
import { AuthService } from '../core/auth/auth.service';

/**
 * Platform Seeding Script
 * Creates two demo tenants, initializes their DBs, seeds permissions, and creates admin users.
 * 
 * Usage: npx ts-node src/scripts/seed.ts
 */
async function seed() {
  const logger = new Logger('DatabaseSeeder');
  logger.log('Starting seed process...');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  const tenantService = app.get(TenantService);
  const connectionManager = app.get(TenantConnectionManager);
  const rbacService = app.get(RbacService);
  const authService = app.get(AuthService);

  const demoTenants = [
    {
      name: 'Acme Health Clinic',
      slug: 'acme',
      adminEmail: 'admin@acme.com',
      dbName: 'saas_tenant_acme',
      activeModules: ['medical'],
    },
    {
      name: 'Globex Corporation',
      slug: 'globex',
      adminEmail: 'admin@globex.com',
      dbName: 'saas_tenant_globex',
      activeModules: [],
    }
  ];

  for (const tDto of demoTenants) {
    try {
      logger.log(`\n--- Provisioning Tenant: ${tDto.slug} ---`);
      
      // 1. Check if tenant already exists
      let tenant = await tenantService.findBySlug(tDto.slug);
      
      if (!tenant) {
        logger.log(`Creating tenant record in main DB...`);
        tenant = await tenantService.create({
          name: tDto.name,
          slug: tDto.slug,
          adminEmail: tDto.adminEmail,
          dbName: tDto.dbName,
          settings: { activeModules: tDto.activeModules },
        });

        // 2. Activate tenant
        tenant = await tenantService.activate(tenant.id);
      }

      // 3. Obtain tenant specific DB connection (this will trigger schema sync internally if enabled)
      const dataSource = await connectionManager.getConnection(tenant.id, {
        dbHost: tenant.dbHost,
        dbPort: tenant.dbPort,
        dbName: tenant.dbName,
        dbUsername: tenant.dbUsername,
        dbPassword: tenant.dbPassword,
      });

      // Synchronize just to be absolutely sure the db schema is ready
      logger.log(`Synchronizing schemas for ${tDto.dbName}...`);
      await dataSource.synchronize(false);

      // 4. Seed RBAC (Roles & Permissions)
      logger.log(`Seeding Default Roles and Permissions...`);
      await rbacService.seedDefaultRolesAndPermissions(dataSource);

      // 5. Create Super Admin User via AuthService
      const userRepo = dataSource.getRepository('users');
      const adminExists = await userRepo.findOne({ where: { email: tDto.adminEmail } });
      
      if (!adminExists) {
        logger.log(`Registering Super Admin user: ${tDto.adminEmail}`);
        const authPayload = await authService.register(dataSource, tenant.id, tenant.slug, {
          email: tDto.adminEmail,
          password: 'Password123!',
          firstName: 'System',
          lastName: 'Admin',
        });

        // Elevate to super_admin
        const roleRepo = dataSource.getRepository('roles');
        const superAdminRole = await roleRepo.findOne({ where: { name: 'super_admin' } });
        
        if (superAdminRole && authPayload.user.id) {
          await rbacService.assignRole(dataSource, authPayload.user.id, (superAdminRole as any).id);
          logger.log(`Assigned super_admin role to ${tDto.adminEmail}`);
        }
      } else {
        logger.log(`Admin user already exists. Skipping creation.`);
      }

      logger.log(`✅ Tenant ${tDto.slug} provisioned successfully!`);

    } catch (error: any) {
      logger.error(`❌ Failed to seed tenant ${tDto.slug}: ${error.message}`, error.stack);
    }
  }

  logger.log('\nSeed process completed.');
  await app.close();
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
