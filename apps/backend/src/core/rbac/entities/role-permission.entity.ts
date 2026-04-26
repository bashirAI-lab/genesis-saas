import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../shared/base/base.entity';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

/**
 * Join entity linking Roles to Permissions.
 * Supports optional JSON conditions for field-level or context-based restrictions.
 * Example condition: { "ownOnly": true } — user can only access their own records.
 */
@Entity('role_permissions')
@Index(['roleId', 'permissionId'], { unique: true })
export class RolePermission extends BaseEntity {
  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @Column({ name: 'permission_id', type: 'uuid' })
  permissionId: string;

  @Column({ type: 'jsonb', nullable: true, default: null })
  conditions: Record<string, any> | null;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
