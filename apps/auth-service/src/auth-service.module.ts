import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { ConfigModule, ConfigService } from '@app/config';
import { PrismaModule } from '@app/prisma';
import { RedisModule } from '@app/redis';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('accessTokenSecret'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}
