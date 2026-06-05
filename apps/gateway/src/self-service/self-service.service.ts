import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { VerifyLocationDto } from '@app/dto';

type IdsGatewayPayload = {
  employeeId: number;
  file: any;
  body: Record<string, any>;
  userAgent?: string | string[];
  appVersion?: string | string[];
};

@Injectable()
export class SelfServiceGatewayService {
  constructor(@Inject('SELF_SERVICE') private readonly client: ClientProxy) {}

  private async send<T>(pattern: string, data?: any): Promise<T> {
    return firstValueFrom(
      this.client.send<T>(pattern, data ?? {}).pipe(
        catchError((err: any) => {
          const rpcBody =
            typeof err?.message === 'object' && err.message !== null
              ? err.message
              : (err?.response ?? err);
          const statusCode = rpcBody?.statusCode ?? err?.statusCode;
          if (statusCode) {
            return throwError(() => new HttpException(rpcBody, statusCode));
          }
          console.error(`Error in RPC call to pattern "${pattern}":`, err);
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
    return this.send('self_service.mobile.transactions.my_check_in_out', {
      employeeId,
    });
  }

  getMyWorkLocation(employeeId: number) {
    return this.send('self_service.mobile.location.my_work_location', {
      employeeId,
    });
  }

  getLastTransactions(employeeId: number) {
    return this.send('self_service.mobile.transactions.last_transactions', {
      employeeId,
    });
  }

  verifyAssignedLocation(employeeId: number, dto: VerifyLocationDto) {
    return this.send('self_service.mobile.location.verify_assigned_location', {
      employeeId,
      coordinates: dto.coordinates,
    });
  }

  verifyLocation(dto: VerifyLocationDto) {
    return this.send('self_service.mobile.location.verify_location', {
      coordinates: dto.coordinates,
    });
  }

  getSparkTodayLocation(employeeId: number) {
    return this.send('self_service.org.spark.today_location', { employeeId });
  }

  punch(payload: IdsGatewayPayload) {
    return this.send('self_service.ids.punch', payload);
  }

  verifyEncounter(payload: IdsGatewayPayload) {
    return this.send('self_service.ids.verify_encounter', payload);
  }
}
