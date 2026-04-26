import { Injectable, CallHandler, ExecutionContext, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLog } from '../base/audit-log.entity';

/**
 * Audit Interceptor.
 * Automatically saves records to the tenant's `audit_logs` table 
 * whenever a mutating (POST/PUT/DELETE) request succeeds.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path, body, tenantDataSource, user } = request;

    // Only audit mutating routes
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return next.handle();
    }

    // Pass through, but hook into the response success event
    return next.handle().pipe(
      tap(async (data: any) => {
        try {
          if (!tenantDataSource) return; // Prevent failure if not a tenant-aware route

          // Try to decipher entity from path loosely (e.g. /api/v1/medical/patients -> 'patients')
          const pathSegments = path.split('/').filter(Boolean);
          const entityName = pathSegments[pathSegments.length - 1] || 'unknown';

          const auditRepo = tenantDataSource.getRepository(AuditLog);
          const auditEvent = auditRepo.create({
            userId: user?.userId || null,
            action: method,
            entityName: entityName,
            // In a real system, you'd pull the newly generated entity ID (e.g., from `data.data.id`)
            entityId: request.params.id || data?.data?.id || 'batch_or_unknown',
            // Only logging new body to save space; complex audits would use TypeORM Subscribers
            newValues: body, 
          });

          await auditRepo.save(auditEvent);
        } catch (err: any) {
           this.logger.error(`Failed to write AuditLog: ${err.message}`);
        }
      }),
    );
  }
}
