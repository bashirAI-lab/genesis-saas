import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../shared/base/base.entity';

/**
 * Tenant registry entity stored in the MAIN database (not tenant DBs).
 * Each row represents one tenant and contains its database connection details.
 */
export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ name: 'db_host', type: 'varchar', length: 255 })
  dbHost: string;

  @Column({ name: 'db_port', type: 'int', default: 5432 })
  dbPort: number;

  @Column({ name: 'db_name', type: 'varchar', length: 255 })
  dbName: string;

  @Column({ name: 'db_username', type: 'varchar', length: 255 })
  dbUsername: string;

  @Column({ name: 'db_password', type: 'varchar', length: 255 })
  dbPassword: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PENDING,
  })
  status: TenantStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain: string | null;

  @Column({ name: 'admin_email', type: 'varchar', length: 255 })
  adminEmail: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ name: 'active_modules', type: 'jsonb', default: [] })
  activeModules: string[];

  @Column({ name: 'max_users', type: 'int', default: 50 })
  maxUsers: number;

  @Column({ name: 'subscription_plan', type: 'varchar', length: 50, default: 'free' })
  subscriptionPlan: string;

  @Column({ name: 'subscription_expires_at', type: 'timestamptz', nullable: true })
  subscriptionExpiresAt: Date | null;
}
