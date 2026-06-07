import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { EmptyResponseException } from '@nestjs/microservices/errors/empty-response.exception';
import { AppLoggerService } from '@app/common';

@Catch(EmptyResponseException)
export class RpcExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger?: AppLoggerService) {}

  catch(exception: EmptyResponseException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();

    this.logger?.error('RPC service unavailable', exception, {
      method: request.method,
      url: request.url,
      userId: request.user?.userId,
      employeeId: request.user?.employeeId,
    });

    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'The requested service is currently unavailable. Please try again later.',
      error: 'Service Unavailable',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
