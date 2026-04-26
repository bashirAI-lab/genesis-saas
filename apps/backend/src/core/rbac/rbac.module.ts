import { Module, Global } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacGuard } from './rbac.guard';

/**
 * RBAC Module — provides permission management and guard.
 * Marked as @Global so RbacGuard can be used anywhere without explicit imports.
 */
@Global()
@Module({
  providers: [RbacService, RbacGuard],
  exports: [RbacService, RbacGuard],
})
export class RbacModule {}
