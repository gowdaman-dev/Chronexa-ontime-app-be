import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { LoggingModule } from '@app/common';
import { UserServiceService } from './user-service.service';
import { UserServiceController } from './user-service.controller';

@Module({
  imports: [
    LoggingModule,
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE',
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
  controllers: [UserServiceController],
  providers: [UserServiceService],
  exports: [UserServiceService],
})
export class UserServiceModule {}
