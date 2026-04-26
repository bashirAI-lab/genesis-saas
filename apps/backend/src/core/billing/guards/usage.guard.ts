import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageService } from '../usage.service';
import { TRACK_USAGE_KEY } from '../decorators/track-usage.decorator';
import { TenantAwareRequest } from '../../shared/interfaces/tenant-aware-request.interface';

/**
 * Usage Guard
 * Introspects the route for @TrackUsage(Entity), and if found, asks the UsageService
 * to verify whether the tenant has exceeded the maximum allowed records for their plan.
 */
@Injectable()
export class UsageGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usageService: UsageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const entityClass = this.reflector.getAllAndOverride<Function>(TRACK_USAGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!entityClass) {
      return true; // No tracking required for this route
    }

    const request = context.switchToHttp().getRequest<TenantAwareRequest>();
    
    if (!request.tenantId || !request.tenantDataSource) {
      return true; // Not a tenant-aware request
    }

    // This will throw a PaymentRequiredException if the limit is breached.
    await this.usageService.checkUsageLimit(
      request.tenantId,
      request.tenantDataSource,
      entityClass,
    );

    return true;
  }
}
