import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { LoggingModule } from '@app/common';
import { SelfServiceGatewayService } from './self-service.service';
import { MobileSelfServiceController } from './controllers/mobile.controller';
import { LeaveController } from './controllers/leave.controller';
import { ShortPermissionController } from './controllers/short-permission.controller';
import { MissingMovementController } from './controllers/missing-movement.controller';
import { ManualTransactionController } from './controllers/manual-transaction.controller';
import { LeaveTypesController } from './controllers/leave-types.controller';
import { PermissionTypesController } from './controllers/permission-types.controller';
import { HolidaysController } from './controllers/holidays.controller';
import { EventTransactionsController } from './controllers/event-transactions.controller';

@Module({
  imports: [
    LoggingModule,
    ClientsModule.registerAsync([
      {
        name: 'SELF_SERVICE',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [config.getOrThrow<string>('natsUrl')],
          },
        }),
      },
    ]),
  ],
  controllers: [
    MobileSelfServiceController,
    LeaveController,
    ShortPermissionController,
    MissingMovementController,
    ManualTransactionController,
    LeaveTypesController,
    PermissionTypesController,
    HolidaysController,
    EventTransactionsController,
  ],
  providers: [SelfServiceGatewayService],
  exports: [SelfServiceGatewayService],
})
export class SelfServiceModule {}
