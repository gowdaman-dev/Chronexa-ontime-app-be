import { NestFactory } from '@nestjs/core';
import { SelfServiceModule } from './self-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@app/config';
async function bootstrap() {
  const app = await NestFactory.create(SelfServiceModule);
  const configService = app.get(ConfigService);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [configService.getOrThrow<string>('natsUrl')],
    },
  });
  await app.startAllMicroservices();
  await app.init();
}
bootstrap();
