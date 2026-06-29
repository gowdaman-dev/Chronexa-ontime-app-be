import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { VerifyLocationDto } from '@app/dto';
import { AppLoggerService, sendRpc } from '@app/common';

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
    private readonly config: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  private send<T>(pattern: string, data?: any): Promise<T> {
    return sendRpc<T>(
      this.selfServiceClient,
      pattern,
      data ?? {},
      this.logger,
      {
        rpcTimeoutMs: this.config.get<number>('rpcTimeoutMs'),
        pattern,
      },
    );
  }

  getMyCheckInOut(employeeId: number) {
    return this.send('mobile_service.transactions.my_check_in_out', {
      employeeId,
    });
  }

  getMyWorkLocation(employeeId: number) {
    return this.send('mobile_service.location.my_work_location', {
      employeeId,
    });
  }

  getLastTransactions(employeeId: number) {
    return this.send('mobile_service.transactions.last_transactions', {
      employeeId,
    });
  }

  verifyAssignedLocation(employeeId: number, dto: VerifyLocationDto) {
    return this.send('mobile_service.location.verify_assigned_location', {
      employeeId,
      coordinates: dto.coordinates,
    });
  }

  verifyLocation(dto: VerifyLocationDto) {
    return this.send('mobile_service.location.verify_location', {
      coordinates: dto.coordinates,
    });
  }

  getSparkTodayLocation(employeeId: number) {
    return this.send('mobile_service.org.spark.today_location', {
      employeeId,
    });
  }

  punch(payload: IdsGatewayPayload) {
    return this.send('self_service.ids.punch', payload);
  }

  verifyEncounter(payload: IdsGatewayPayload) {
    return this.send('mobile_service.ids.verify_encounter', payload);
  }

  workflow(pattern: string, payload: any) {
    return this.send(pattern, payload);
  }
}
