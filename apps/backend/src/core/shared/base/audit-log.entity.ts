import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Tenant-scoped Audit Log.
 * Records 'who did what' across all modules inside this isolated database.
 */
@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column({ name: 'user_id', nullable: true })
  userId: string; // If null, done by system

  @Column()
  action: string; // e.g. 'CREATE', 'UPDATE', 'DELETE'

  @Column({ name: 'entity_name' })
  entityName: string;

  @Column()
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;
}
