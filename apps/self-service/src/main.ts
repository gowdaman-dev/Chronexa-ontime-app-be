import { NestFactory } from '@nestjs/core';
import { SelfServiceModule } from './self-service.module';

async function bootstrap() {
  const app = await NestFactory.create(SelfServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
