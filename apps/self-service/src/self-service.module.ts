import { Module } from '@nestjs/common';
import { SelfServiceController } from './self-service.controller';
import { SelfServiceService } from './self-service.service';
import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/prisma';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [SelfServiceController],
  providers: [SelfServiceService],
})
export class SelfServiceModule {}
