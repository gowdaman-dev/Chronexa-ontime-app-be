import { Module } from '@nestjs/common';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/prisma';
import { RedisModule } from '@app/redis';
import { LoggingModule } from '@app/common';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, LoggingModule],
  controllers: [UserServiceController],
  providers: [UserServiceService],
})
export class UserServiceModule {}
