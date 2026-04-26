import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ModuleRegistryService } from '../../module-registry/module-registry.service';
import { PlanRanks } from '../billing.constants';

/**
 * Subscription Guard
 * 
 * 1. Checks if the Tenant's subscription has expired.
 * 2. Checks if the route belongs to a module, and if so, verifies the tenant
 *    has the required subscription tier to access it.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly moduleRegistry: ModuleRegistryService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantInfo = request.tenantInfo;

    // If it's not a tenant-aware request, pass (auth routes, platform admins)
    if (!tenantInfo) {
      return true;
    }

    // 1. Check Subscription Expiry
    if (tenantInfo.subscriptionExpiresAt && new Date(tenantInfo.subscriptionExpiresAt) < new Date()) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: 'Your subscription has expired. Please update your payment method.',
          error: 'SUBSCRIPTION_EXPIRED',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // 2. Extract requested module from path.
    // e.g., /api/v1/medical/patients -> 'medical'
    const pathSegments = request.path.split('/').filter(Boolean);
    const apiIndex = pathSegments.indexOf('api');
    
    if (apiIndex !== -1 && pathSegments.length > apiIndex + 2) {
      // Typically: /api/v1/{module}/...
      const potentialModuleCode = pathSegments[apiIndex + 2];
      
      const module = this.moduleRegistry.getAllModules().find(m => m.code === potentialModuleCode);
      
      if (module && module.requiredPlan) {
        const tenantPlan = (tenantInfo.subscriptionPlan || 'free').toLowerCase();
        const requiredPlan = module.requiredPlan.toLowerCase();

        const tenantRank = PlanRanks[tenantPlan] ?? 0;
        const requiredRank = PlanRanks[requiredPlan] ?? 0;

        if (tenantRank < requiredRank) {
          throw new HttpException(
            {
              statusCode: HttpStatus.PAYMENT_REQUIRED,
              message: `Access to ${module.name} requires the ${requiredPlan} plan or higher.`,
              error: 'UPGRADE_REQUIRED',
            },
            HttpStatus.PAYMENT_REQUIRED,
          );
        }
      }
    }

    return true;
  }
}
