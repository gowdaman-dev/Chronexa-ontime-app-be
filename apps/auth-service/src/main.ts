import { NestFactory } from '@nestjs/core';
import { AuthServiceModule } from './auth-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@app/config';
import { AppLoggerService } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AuthServiceModule, {
    bufferLogs: true,
  });
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);
  const configService = app.get(ConfigService);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [configService.getOrThrow<string>('natsUrl')],
      queue: 'auth_service_queue',
      queueOptions: {
        durable: false,
      },
    },
  });
  await app.startAllMicroservices();
  await app.init();
  logger.info('Auth-service microservice started');
}
bootstrap();
