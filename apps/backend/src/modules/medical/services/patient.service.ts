import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/shared/base/base.service';
import { Patient } from '../entities/patient.entity';

/**
 * Patient Service — extends BaseService for CRUD operations.
 * The BaseService handles all boilerplate (pagination, search, etc.)
 * This service only needs to define searchable columns and any custom methods.
 */
@Injectable()
export class PatientService extends BaseService<Patient> {
  protected searchableColumns = ['firstName', 'lastName', 'email', 'medicalRecordNumber'];

  constructor() {
    super(Patient);
  }

  // Add any patient-specific methods here.
  // The CRUD operations (create, findAll, findOne, update, remove) are inherited.
}
