/**
 * Shared tenant types used by both frontend and backend.
 */

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  domain: string | null;
  adminEmail: string;
  settings: Record<string, any>;
  activeModules: string[];
  subscriptionPlan: string;
  maxUsers: number;
  createdAt: string;
}

export interface TenantConnectionConfig {
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUsername: string;
  dbPassword: string;
}
