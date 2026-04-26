import { Module, DynamicModule, OnModuleInit } from '@nestjs/common';
import { ModuleRegistryService } from '../../core/module-registry/module-registry.service';
import { MEDICAL_MANIFEST } from './medical.manifest';
import { PatientService } from './services/patient.service';
import { AppointmentService } from './services/appointment.service';
import { PatientController } from './controllers/patient.controller';
import { AppointmentController } from './controllers/appointment.controller';

/**
 * Medical Module — a reference plugin implementation.
 *
 * Demonstrates the plugin pattern:
 * 1. Defines its own entities, services, and controllers
 * 2. Self-registers with the ModuleRegistry via forRoot()
 * 3. The Core Engine never imports or references this module's internals
 *
 * Usage in AppModule:
 *   imports: [MedicalModule.forRoot()]
 */
@Module({})
export class MedicalModule implements OnModuleInit {
  constructor(private readonly moduleRegistry: ModuleRegistryService) {}

  static forRoot(): DynamicModule {
    return {
      module: MedicalModule,
      controllers: [PatientController, AppointmentController],
      providers: [PatientService, AppointmentService],
      exports: [PatientService, AppointmentService],
    };
  }

  /**
   * Self-register with the module registry on initialization.
   * This is where the plugin "plugs in" to the core engine.
   */
  onModuleInit() {
    this.moduleRegistry.register(MEDICAL_MANIFEST);
  }
}
