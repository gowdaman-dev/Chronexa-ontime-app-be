import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@app/config';

const { MobileServiceModule } = require('./mobile-service.module');

async function bootstrap() {
  const app = await NestFactory.create(MobileServiceModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [configService.getOrThrow<string>('natsUrl')],
      queue: 'mobile-service-queue',
    },
  });

  await app.startAllMicroservices();
  await app.init();
}

bootstrap();
