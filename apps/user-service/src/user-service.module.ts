import { Module } from '@nestjs/common';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/prisma';
import { RedisModule } from '@app/redis';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule],
  controllers: [UserServiceController],
  providers: [UserServiceService],
})
export class UserServiceModule {}
