import { Req, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { BaseService } from './base.service';
import { BaseEntity } from './base.entity';

/**
 * Abstract Base Controller that all domain controllers inherit from.
 * Provides standard CRUD endpoints following DRY principle.
 *
 * Usage:
 *   @Controller('patients')
 *   export class PatientController extends BaseController<Patient> {
 *     constructor(service: PatientService) { super(service); }
 *   }
 */
export abstract class BaseController<T extends BaseEntity> {
  constructor(protected readonly baseService: BaseService<T>) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Body() dto: Record<string, any>,
  ) {
    const tenantReq = req as any;
    const entity = await this.baseService.create(tenantReq.tenantDataSource, dto as Partial<T>);
    return {
      success: true,
      data: entity,
      message: 'Resource created successfully.',
    };
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const tenantReq = req as any;
    const result = await this.baseService.findAll(tenantReq.tenantDataSource, {
      page: Number(page),
      limit: Math.min(Number(limit), 100), // Cap at 100
      search,
      sortBy,
      sortOrder: sortOrder || 'DESC',
    });

    return {
      success: true,
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const tenantReq = req as any;
    const entity = await this.baseService.findOne(tenantReq.tenantDataSource, id);
    return {
      success: true,
      data: entity,
    };
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
  ) {
    const tenantReq = req as any;
    const entity = await this.baseService.update(tenantReq.tenantDataSource, id, dto as Partial<T>);
    return {
      success: true,
      data: entity,
      message: 'Resource updated successfully.',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const tenantReq = req as any;
    await this.baseService.remove(tenantReq.tenantDataSource, id);
  }
}
