import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { SelfServiceController } from './self-service.controller';
import { SelfServiceGatewayService } from './self-service.service';

@Module({
  imports: [
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
  controllers: [SelfServiceController],
  providers: [SelfServiceGatewayService],
  exports: [SelfServiceGatewayService],
})
export class SelfServiceModule {}
