import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { AppLoggerService } from '@app/common';

@Injectable()
export class ReportGatewayService {
  constructor(
    @Inject('REPORT_SERVICE') private readonly reportClient: ClientProxy,
    private readonly logger: AppLoggerService,
  ) {}

  private async send<T>(pattern: string, data?: any): Promise<T> {
    return firstValueFrom(
      this.reportClient.send<T>(pattern, data ?? {}).pipe(
        catchError((err: any) => {
          const rpcBody =
            typeof err?.message === 'object' && err.message !== null
              ? err.message
              : (err?.response ?? err);
          const statusCode = rpcBody?.statusCode ?? err?.statusCode;
          if (statusCode) {
            this.logger.warn('Report RPC returned application error', {
              pattern,
              statusCode,
              message: rpcBody?.message,
            });
            return throwError(() => new HttpException(rpcBody, statusCode));
          }
          this.logger.error('Report RPC call failed', err, { pattern });
          return throwError(
            () =>
              new HttpException(
                'Service unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
              ),
          );
        }),
      ),
    );
  }

  run(pattern: string, payload: any) {
    return this.send(pattern, payload);
  }
}
