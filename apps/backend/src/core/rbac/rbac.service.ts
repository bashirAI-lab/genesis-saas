import { Injectable, Logger } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';

/**
 * RBAC Service — resolves user permissions with Redis caching.
 * Operates on TENANT databases (the DataSource comes from the request context).
 */
@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);
  private readonly redis: Redis;
  private readonly cacheTtl: number;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      keyPrefix: 'rbac:',
    });
    this.cacheTtl = 300; // 5 minutes
  }

  /**
   * Check if a user has ALL the specified permissions.
   */
  async userHasPermissions(
    dataSource: DataSource,
    userId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(dataSource, userId);

    // super_admin has wildcard access
    if (userPermissions.includes('*')) {
      return true;
    }

    return requiredPermissions.every((perm) => userPermissions.includes(perm));
  }

  /**
   * Get all effective permissions for a user (union of all role permissions).
   * Results are cached in Redis keyed by tenantDbName:userId.
   */
  async getUserPermissions(dataSource: DataSource, userId: string): Promise<string[]> {
    const cacheKey = `${dataSource.options.database}:${userId}`;

    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Build permissions from database
    const permissions = await this.buildUserPermissions(dataSource, userId);

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, this.cacheTtl, JSON.stringify(permissions));

    return permissions;
  }

  /**
   * Invalidate cached permissions (call when roles/permissions change).
   */
  async invalidateUserPermissions(dbName: string, userId: string): Promise<void> {
    await this.redis.del(`${dbName}:${userId}`);
    this.logger.log(`Invalidated permissions cache for user: ${userId}`);
  }

  /**
   * Assign a role to a user.
   */
  async assignRole(
    dataSource: DataSource,
    userId: string,
    roleId: string,
    assignedBy?: string,
  ): Promise<UserRole> {
    const userRoleRepo = dataSource.getRepository(UserRole);

    const existing = await userRoleRepo.findOne({
      where: { userId, roleId },
    });

    if (existing) {
      return existing;
    }

    const userRole = userRoleRepo.create({
      userId,
      roleId,
      assignedBy,
    });

    const saved = await userRoleRepo.save(userRole);

    // Invalidate cache
    await this.invalidateUserPermissions(
      dataSource.options.database as string,
      userId,
    );

    return saved;
  }

  /**
   * Remove a role from a user.
   */
  async removeRole(
    dataSource: DataSource,
    userId: string,
    roleId: string,
  ): Promise<void> {
    const userRoleRepo = dataSource.getRepository(UserRole);
    await userRoleRepo.delete({ userId, roleId });

    await this.invalidateUserPermissions(
      dataSource.options.database as string,
      userId,
    );
  }

  /**
   * Seed default system roles and core permissions into a tenant database.
   * Called during tenant provisioning.
   */
  async seedDefaultRolesAndPermissions(dataSource: DataSource): Promise<void> {
    const roleRepo = dataSource.getRepository(Role);
    const permRepo = dataSource.getRepository(Permission);
    const rpRepo = dataSource.getRepository(RolePermission);

    // ─── Core Permissions ────────────────────────────────────
    const corePermissions = [
      { module: 'core', resource: 'users', action: 'create', description: 'Create users' },
      { module: 'core', resource: 'users', action: 'read', description: 'View users' },
      { module: 'core', resource: 'users', action: 'update', description: 'Update users' },
      { module: 'core', resource: 'users', action: 'delete', description: 'Delete users' },
      { module: 'core', resource: 'roles', action: 'create', description: 'Create roles' },
      { module: 'core', resource: 'roles', action: 'read', description: 'View roles' },
      { module: 'core', resource: 'roles', action: 'update', description: 'Update roles' },
      { module: 'core', resource: 'roles', action: 'delete', description: 'Delete roles' },
      { module: 'core', resource: 'permissions', action: 'read', description: 'View permissions' },
      { module: 'core', resource: 'settings', action: 'read', description: 'View settings' },
      { module: 'core', resource: 'settings', action: 'update', description: 'Update settings' },
      { module: 'core', resource: 'modules', action: 'manage', description: 'Manage modules' },
    ];

    const savedPerms: Permission[] = [];
    for (const perm of corePermissions) {
      const existing = await permRepo.findOne({
        where: { module: perm.module, resource: perm.resource, action: perm.action },
      });
      if (!existing) {
        savedPerms.push(await permRepo.save(permRepo.create(perm)));
      } else {
        savedPerms.push(existing);
      }
    }

    // ─── System Roles ────────────────────────────────────────
    const roles = [
      {
        name: 'super_admin',
        displayName: 'Super Administrator',
        description: 'Full access to all resources and settings.',
        isSystem: true,
      },
      {
        name: 'tenant_admin',
        displayName: 'Tenant Administrator',
        description: 'Full access within the tenant scope.',
        isSystem: true,
      },
      {
        name: 'manager',
        displayName: 'Manager',
        description: 'Can manage assigned modules and read all data.',
        isSystem: true,
      },
      {
        name: 'viewer',
        displayName: 'Viewer',
        description: 'Read-only access to permitted resources.',
        isSystem: true,
      },
    ];

    for (const roleData of roles) {
      let role = await roleRepo.findOne({ where: { name: roleData.name } });
      if (!role) {
        role = await roleRepo.save(roleRepo.create(roleData));
      }

      // Assign permissions based on role
      if (roleData.name === 'tenant_admin') {
        // Tenant admin gets all core permissions
        for (const perm of savedPerms) {
          const exists = await rpRepo.findOne({
            where: { roleId: role.id, permissionId: perm.id },
          });
          if (!exists) {
            await rpRepo.save(rpRepo.create({ roleId: role.id, permissionId: perm.id }));
          }
        }
      } else if (roleData.name === 'viewer') {
        // Viewer gets only read permissions
        const readPerms = savedPerms.filter((p) => p.action === 'read');
        for (const perm of readPerms) {
          const exists = await rpRepo.findOne({
            where: { roleId: role.id, permissionId: perm.id },
          });
          if (!exists) {
            await rpRepo.save(rpRepo.create({ roleId: role.id, permissionId: perm.id }));
          }
        }
      }
    }

    this.logger.log('Default roles and permissions seeded successfully');
  }

  // ─── Private Methods ──────────────────────────────────────

  /**
   * Build the full permission set for a user by traversing:
   * User → UserRoles → Roles → RolePermissions → Permissions
   */
  private async buildUserPermissions(
    dataSource: DataSource,
    userId: string,
  ): Promise<string[]> {
    const userRoleRepo = dataSource.getRepository(UserRole);

    // Get all roles assigned to the user
    const userRoles = await userRoleRepo.find({
      where: { userId },
      relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
    });

    const permissions = new Set<string>();

    for (const ur of userRoles) {
      // super_admin gets wildcard
      if (ur.role.name === 'super_admin') {
        permissions.add('*');
        break;
      }

      for (const rp of ur.role.rolePermissions || []) {
        if (rp.permission) {
          permissions.add(`${rp.permission.module}:${rp.permission.resource}:${rp.permission.action}`);
        }
      }
    }

    return Array.from(permissions);
  }
}
