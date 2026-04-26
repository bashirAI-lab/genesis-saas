import { ModuleManifest } from '../../core/shared/interfaces/pluggable-module.interface';
import { Patient } from './entities/patient.entity';
import { Appointment } from './entities/appointment.entity';

/**
 * Medical Module Manifest — the self-describing contract.
 *
 * This file is the ONLY thing the Core Engine reads to understand the module.
 * It declares:
 * - What permissions the module introduces
 * - What entities it adds to tenant databases
 * - What navigation items appear in the frontend sidebar
 */
export const MEDICAL_MANIFEST: ModuleManifest = {
  code: 'medical',
  name: 'Medical Management',
  version: '1.0.0',
  description: 'Patient records, appointments, and clinical workflow management.',
  requiredPlan: 'gold',

  permissions: [
    { resource: 'patients', action: 'create', description: 'Create patient records' },
    { resource: 'patients', action: 'read', description: 'View patient records' },
    { resource: 'patients', action: 'update', description: 'Update patient records' },
    { resource: 'patients', action: 'delete', description: 'Delete patient records' },
    { resource: 'appointments', action: 'create', description: 'Create appointments' },
    { resource: 'appointments', action: 'read', description: 'View appointments' },
    { resource: 'appointments', action: 'update', description: 'Update appointments' },
    { resource: 'appointments', action: 'delete', description: 'Cancel appointments' },
  ],

  entities: [Patient, Appointment],

  navigation: [
    {
      label: 'Medical',
      path: '/medical',
      icon: 'stethoscope',
      children: [
        {
          label: 'Patients',
          path: '/medical/patients',
          icon: 'users',
          requiredPermission: 'medical:patients:read',
        },
        {
          label: 'Appointments',
          path: '/medical/appointments',
          icon: 'calendar',
          requiredPermission: 'medical:appointments:read',
        },
      ],
    },
  ],
};
