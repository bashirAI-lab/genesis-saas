import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TenantService, CreateTenantDto, UpdateTenantDto } from './tenant.service';
import { TenantStatus } from './tenant.entity';

/**
 * Platform-level tenant management controller.
 * Only accessible by platform super_admins (not tenant admins).
 *
 * Routes: /api/v1/tenants
 */
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTenantDto) {
    const tenant = await this.tenantService.create(dto);
    return {
      success: true,
      data: tenant,
      message: 'Tenant created successfully. Activate after provisioning the database.',
    };
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('plan') plan?: string,
  ) {
    const tenants = await this.tenantService.findAll({
      status: status as TenantStatus | undefined,
      plan,
    });
    return {
      success: true,
      data: tenants,
      count: tenants.length,
    };
  }

  @Get('pool-stats')
  getPoolStats() {
    return {
      success: true,
      data: this.tenantService.getPoolStats(),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tenant = await this.tenantService.findById(id);
    return {
      success: true,
      data: tenant,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    const tenant = await this.tenantService.update(id, dto);
    return {
      success: true,
      data: tenant,
      message: 'Tenant updated successfully.',
    };
  }

  @Put(':id/activate')
  async activate(@Param('id') id: string) {
    const tenant = await this.tenantService.activate(id);
    return {
      success: true,
      data: tenant,
      message: 'Tenant activated successfully.',
    };
  }

  @Put(':id/suspend')
  async suspend(@Param('id') id: string) {
    const tenant = await this.tenantService.suspend(id);
    return {
      success: true,
      data: tenant,
      message: 'Tenant suspended. Active connections have been closed.',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.tenantService.remove(id);
  }
}
