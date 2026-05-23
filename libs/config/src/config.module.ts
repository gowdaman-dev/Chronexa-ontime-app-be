import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigModule as GlobalConfigModule } from '@nestjs/config';
import base from './config/base';
import ms from './config/ms';
@Global()
@Module({
  imports: [
    GlobalConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      load: [base, ms],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
