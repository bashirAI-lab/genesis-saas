import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator';
import { TenantAwareRequest } from '../shared/interfaces/tenant-aware-request.interface';
import { RbacService } from './rbac.service';

/**
 * RBAC Guard — checks if the authenticated user has the required permissions.
 *
 * Flow:
 * 1. Read required permissions from @RequirePermissions() decorator metadata
 * 2. If no permissions required, allow access (public endpoint)
 * 3. Extract userId from JWT payload (set by JwtAuthGuard)
 * 4. Load user's effective permissions (with Redis caching)
 * 5. Verify ALL required permissions are satisfied
 *
 * Applied after JwtAuthGuard in the guard chain.
 */
@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required — allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantAwareRequest>();
    const user = (request as any).user;

    if (!user || !user.userId) {
      throw new HttpException(
        'Authentication required for this resource',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Check permissions against the tenant's database
    const hasPermission = await this.rbacService.userHasPermissions(
      request.tenantDataSource,
      user.userId,
      requiredPermissions,
    );

    if (!hasPermission) {
      this.logger.warn(
        `Access denied for user ${user.userId} — missing: ${requiredPermissions.join(', ')}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Insufficient permissions for this action.',
          required: requiredPermissions,
          error: 'INSUFFICIENT_PERMISSIONS',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
