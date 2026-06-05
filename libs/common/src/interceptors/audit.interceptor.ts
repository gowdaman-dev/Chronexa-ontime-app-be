import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../services/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        void this.auditService.create({
          employee_id:
            req.user?.employeeId !== undefined
              ? String(req.user.employeeId)
              : 'SYSTEM',

          event_type: 'API_REQUEST',

          description: `${req.method} ${req.originalUrl}`,

          http_method: req.method,

          endpoint: req.originalUrl,

          response_status: res.statusCode,

          ip_address: req.ip,

          user_agent: req.headers['user-agent'],

          is_success: res.statusCode < 400,

          app_version_no: req.headers['x-app-version'],
        }).catch((error) => {
          console.error('Audit log write failed:', error);
        });
      }),
    );
  }
}
