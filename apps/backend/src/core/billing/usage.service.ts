import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PlanLimits } from './billing.constants';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private readonly tenantService: TenantService) {}

  /**
   * Evaluates if a tenant has exceeded their plan's record creation limits.
   * Intercepts BaseService creations.
   */
  async checkUsageLimit(
    tenantId: string,
    dataSource: DataSource,
    entityTarget: any,
  ): Promise<void> {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) return;

    const plan = (tenant.subscriptionPlan || 'free').toLowerCase();
    const limits = PlanLimits[plan];
    
    // Safety check - if unlimited or no limits defined, proceed
    if (!limits || limits.maxRecords === undefined) return;

    // Fast count using TypeORM repository
    const repository = dataSource.getRepository(entityTarget);
    const currentCount = await repository.count();

    if (currentCount >= limits.maxRecords) {
      this.logger.warn(`Tenant ${tenant.slug} reached max limit of ${limits.maxRecords} records on ${plan} plan.`);
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: `You have reached the maximum allowed records (${limits.maxRecords}) for the ${plan} plan. Please upgrade to continue.`,
          error: 'USAGE_LIMIT_EXCEEDED',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }
}
