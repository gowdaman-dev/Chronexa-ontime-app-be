import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from './user-service.module';
import { ConfigService } from '@app/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(UserServiceModule);
  const configService = app.get(ConfigService);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [configService.getOrThrow<string>('natsUrl')],
      queue: 'user-service-queue',
    },
  });
  await app.startAllMicroservices();
  await app.init();
}
bootstrap();
