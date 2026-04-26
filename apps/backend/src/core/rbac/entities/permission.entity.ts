import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../shared/base/base.entity';

/**
 * Permission entity — lives in each TENANT database.
 * Permissions follow the convention: module:resource:action
 * Example: 'medical:patients:create'
 */
@Entity('permissions')
@Index(['module', 'resource', 'action'], { unique: true })
export class Permission extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  module: string;

  @Column({ type: 'varchar', length: 100 })
  resource: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Computed permission string for easy matching */
  get permissionString(): string {
    return `${this.module}:${this.resource}:${this.action}`;
  }
}
