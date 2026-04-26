import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base/base.entity';
import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';

/**
 * Role entity — lives in each TENANT database.
 * System roles (is_system = true) cannot be deleted by tenant admins.
 */
@Entity('roles')
export class Role extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @OneToMany(() => RolePermission, (rp) => rp.role, { eager: true })
  rolePermissions: RolePermission[];

  @OneToMany(() => UserRole, (ur) => ur.role)
  userRoles: UserRole[];
}
