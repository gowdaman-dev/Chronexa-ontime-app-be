import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { VerifyLocationDto } from '@app/dto';
import { AppLoggerService } from '@app/common';

type IdsGatewayPayload = {
  employeeId: number;
  file: any;
  body: Record<string, any>;
  userAgent?: string | string[];
  appVersion?: string | string[];
};

@Injectable()
export class SelfServiceGatewayService {
  constructor(
    @Inject('SELF_SERVICE') private readonly selfServiceClient: ClientProxy,
    @Inject('MOBILE_SERVICE') private readonly mobileServiceClient: ClientProxy,
    private readonly logger: AppLoggerService,
  ) {}

  private async send<T>(
    client: ClientProxy,
    pattern: string,
    data?: any,
  ): Promise<T> {
    return firstValueFrom(
      client.send<T>(pattern, data ?? {}).pipe(
        catchError((err: any) => {
          const rpcBody =
            typeof err?.message === 'object' && err.message !== null
              ? err.message
              : (err?.response ?? err);
          const statusCode = rpcBody?.statusCode ?? err?.statusCode;
          if (statusCode) {
            this.logger.warn('RPC call returned application error', {
              pattern,
              statusCode,
              message: rpcBody?.message,
            });
            return throwError(() => new HttpException(rpcBody, statusCode));
          }
          this.logger.error('RPC call failed', err, { pattern });
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

  getMyCheckInOut(employeeId: number) {
    return this.send(this.mobileServiceClient, 'mobile_service.transactions.my_check_in_out', {
      employeeId,
    });
  }

  getMyWorkLocation(employeeId: number) {
    return this.send(this.mobileServiceClient, 'mobile_service.location.my_work_location', {
      employeeId,
    });
  }

  getLastTransactions(employeeId: number) {
    return this.send(this.mobileServiceClient, 'mobile_service.transactions.last_transactions', {
      employeeId,
    });
  }

  verifyAssignedLocation(employeeId: number, dto: VerifyLocationDto) {
    return this.send(
      this.mobileServiceClient,
      'mobile_service.location.verify_assigned_location',
      {
        employeeId,
        coordinates: dto.coordinates,
      },
    );
  }

  verifyLocation(dto: VerifyLocationDto) {
    return this.send(this.mobileServiceClient, 'mobile_service.location.verify_location', {
      coordinates: dto.coordinates,
    });
  }

  getSparkTodayLocation(employeeId: number) {
    return this.send(this.mobileServiceClient, 'mobile_service.org.spark.today_location', {
      employeeId,
    });
  }

  punch(payload: IdsGatewayPayload) {
    return this.send(this.selfServiceClient, 'self_service.ids.punch', payload);
  }

  verifyEncounter(payload: IdsGatewayPayload) {
    return this.send(
      this.mobileServiceClient,
      'mobile_service.ids.verify_encounter',
      payload,
    );
  }
}
