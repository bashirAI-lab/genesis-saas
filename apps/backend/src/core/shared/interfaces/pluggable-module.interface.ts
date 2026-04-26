/**
 * Contract that every plugin module must implement.
 * The Module Registry uses this to discover, register, and manage modules.
 */
export interface ModuleManifest {
  /** Unique module code (e.g., 'medical', 'ecommerce') */
  code: string;

  /** Human-readable module name */
  name: string;

  /** Semantic version */
  version: string;

  /** Brief description of the module */
  description: string;

  /** Permissions this module introduces */
  permissions: ModulePermission[];

  /** TypeORM entities this module provides (for tenant DB migrations) */
  entities: Function[];

  /** Navigation items for the frontend sidebar */
  navigation: ModuleNavItem[];

  /** Minimum subscription plan required to load this module (e.g., 'gold') */
  requiredPlan?: string;
}

export interface ModulePermission {
  /** Permission string (e.g., 'medical:patients:read') */
  resource: string;
  action: string;
  description: string;
}

export interface ModuleNavItem {
  /** Display label */
  label: string;

  /** Route path */
  path: string;

  /** Icon identifier (e.g., 'stethoscope', 'shopping-cart') */
  icon: string;

  /** Required permission to see this nav item */
  requiredPermission?: string;

  /** Child navigation items */
  children?: ModuleNavItem[];
}
