import { Global, Module } from '@nestjs/common';
import {
  APP_LOGGER_OPTIONS,
  AppLoggerService,
} from '../services/app-logger.service';

@Global()
@Module({
  providers: [
    { provide: APP_LOGGER_OPTIONS, useValue: {} },
    AppLoggerService,
  ],
  exports: [AppLoggerService],
})
export class LoggingModule {}
