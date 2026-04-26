import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../core/shared/base/base.entity';

/**
 * Patient entity — Medical module domain model.
 * Stored in each TENANT database that has the Medical module active.
 */
@Entity('patients')
export class Patient extends BaseEntity {
  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Index({ unique: true })
  @Column({ name: 'medical_record_number', type: 'varchar', length: 50 })
  medicalRecordNumber: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 10 })
  gender: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'blood_type', type: 'varchar', length: 5, nullable: true })
  bloodType: string | null;

  @Column({ type: 'text', nullable: true })
  allergies: string | null;

  @Column({ name: 'emergency_contact', type: 'jsonb', nullable: true })
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  } | null;

  @Column({ name: 'insurance_info', type: 'jsonb', nullable: true })
  insuranceInfo: Record<string, any> | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
