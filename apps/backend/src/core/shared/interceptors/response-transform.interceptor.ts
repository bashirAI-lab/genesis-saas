import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Response transformation interceptor.
 * Wraps successful responses in a consistent envelope format.
 *
 * If the controller already returns { success: true, ... }, it's passed through.
 * Otherwise, data is wrapped in { success: true, data: ... }.
 */
@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If response already follows our format, pass through
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Wrap in standard envelope
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
