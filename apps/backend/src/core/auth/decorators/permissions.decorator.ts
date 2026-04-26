import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by the RBAC guard.
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions on a controller method.
 *
 * Usage:
 *   @RequirePermissions('medical:patients:create')
 *   @Post()
 *   async createPatient() { ... }
 *
 *   // Require multiple permissions (ALL must be satisfied):
 *   @RequirePermissions('core:users:read', 'core:roles:read')
 *   @Get('user-roles')
 *   async getUserRoles() { ... }
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
