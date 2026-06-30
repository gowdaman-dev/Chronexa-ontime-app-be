import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { LoggingModule } from '@app/common';
import { AuthServiceService } from './auth-service.service';
import { AuthServiceController } from './auth-service.controller';

@Module({
  imports: [
    LoggingModule,
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [config.getOrThrow<string>('natsUrl')],
            queue: 'auth_service_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
  exports: [AuthServiceService],
})
export class AuthServiceModule {}
