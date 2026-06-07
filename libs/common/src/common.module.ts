import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { LoggingModule } from './modules/logging.module';

@Module({
  imports: [LoggingModule],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
