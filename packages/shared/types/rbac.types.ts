/**
 * Shared RBAC types used by both frontend and backend.
 */

export interface RoleInfo {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
}

export interface PermissionInfo {
  id: string;
  module: string;
  resource: string;
  action: string;
  description: string | null;
  permissionString: string; // "module:resource:action"
}

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  roleName: string;
  assignedAt: string;
  assignedBy: string | null;
}

/** Default system roles */
export enum SystemRole {
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
  MANAGER = 'manager',
  VIEWER = 'viewer',
}
