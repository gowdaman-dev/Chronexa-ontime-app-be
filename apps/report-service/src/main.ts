import { NestFactory } from '@nestjs/core';
import { ReportServiceModule } from './report-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@app/config';

async function bootstrap() {
  const app = await NestFactory.create(ReportServiceModule);
  const configService = app.get(ConfigService);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [configService.getOrThrow<string>('natsUrl')],
      queue: 'report-service-queue',
    },
  });
  await app.startAllMicroservices();
  await app.init();
}
bootstrap();
