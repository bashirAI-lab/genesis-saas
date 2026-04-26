import { Controller, UseGuards, Post, Req, Body } from '@nestjs/common';
import { BaseController } from '../../../core/shared/base/base.controller';
import { Patient } from '../entities/patient.entity';
import { PatientService } from '../services/patient.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../../core/rbac/rbac.guard';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { TrackUsage } from '../../../core/billing/decorators/track-usage.decorator';

/**
 * Patient Controller — demonstrates how concise module controllers are.
 * All CRUD endpoints are inherited from BaseController.
 * Only permissions decorators and any custom endpoints need to be defined.
 *
 * Routes: /api/v1/medical/patients
 */
@Controller('medical/patients')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PatientController extends BaseController<Patient> {
  constructor(private readonly patientService: PatientService) {
    super(patientService);
  }

  // Inherited endpoints:
  // GET    /medical/patients          → findAll()
  // GET    /medical/patients/:id      → findOne()
  // PUT    /medical/patients/:id      → update()
  // DELETE /medical/patients/:id      → remove()

  @Post()
  @TrackUsage(Patient)
  async create(
    @Req() req: any,
    @Body() dto: Record<string, any>,
  ) {
    return super.create(req, dto);
  }

  // Add custom endpoints below:
  // @Get('search-by-blood-type')
  // @RequirePermissions('medical:patients:read')
  // async searchByBloodType(@Query('type') bloodType: string) { ... }
}
