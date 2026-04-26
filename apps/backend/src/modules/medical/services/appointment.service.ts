import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/shared/base/base.service';
import { Appointment } from '../entities/appointment.entity';

@Injectable()
export class AppointmentService extends BaseService<Appointment> {
  protected searchableColumns = ['type', 'reason', 'room'];

  constructor() {
    super(Appointment);
  }
}
