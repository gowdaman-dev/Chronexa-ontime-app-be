import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EmptyResponseException } from '@nestjs/microservices/errors/empty-response.exception';
import { AppLoggerService } from '@app/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();

    if (exception instanceof EmptyResponseException) {
      this.logger.error('RPC service unavailable', exception, {
        method: request.method,
        url: request.url,
        userId: request.user?.userId,
        employeeId: request.user?.employeeId,
      });

      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'The requested service is currently unavailable. Please try again later.',
        error: 'Service Unavailable',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (status >= 500) {
        this.logger.error('HTTP exception', exception, {
          method: request.method,
          url: request.url,
          status,
        });
      }
      response.status(status).json(body);
      return;
    }

    this.logger.error('Unhandled exception', exception, {
      method: request.method,
      url: request.url,
      userId: request.user?.userId,
      employeeId: request.user?.employeeId,
    });

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
