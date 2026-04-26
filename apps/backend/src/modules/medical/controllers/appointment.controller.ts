import { Controller, UseGuards } from '@nestjs/common';
import { BaseController } from '../../../core/shared/base/base.controller';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentService } from '../services/appointment.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../../core/rbac/rbac.guard';

/**
 * Appointment Controller
 * Routes: /api/v1/medical/appointments
 */
@Controller('medical/appointments')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AppointmentController extends BaseController<Appointment> {
  constructor(private readonly appointmentService: AppointmentService) {
    super(appointmentService);
  }
}
