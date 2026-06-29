import { NestFactory } from '@nestjs/core';
import { SelfServiceModule } from './self-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@app/config';
import { AppLoggerService } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(SelfServiceModule, {
    bufferLogs: true,
  });
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);
  const configService = app.get(ConfigService);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [configService.getOrThrow<string>('natsUrl')],
    },
  });
  await app.startAllMicroservices();
  await app.init();
  logger.info('Self-service microservice started');
}
bootstrap();
