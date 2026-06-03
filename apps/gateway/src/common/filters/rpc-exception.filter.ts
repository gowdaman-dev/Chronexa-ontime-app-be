import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { EmptyResponseException } from '@nestjs/microservices/errors/empty-response.exception';

@Catch(EmptyResponseException)
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: EmptyResponseException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();

    this.logger.error(`RPC Error [${request.method} ${request.url}]: ${exception.message}`);

    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'The requested service is currently unavailable. Please try again later.',
      error: 'Service Unavailable',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
