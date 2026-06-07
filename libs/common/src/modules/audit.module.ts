import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { AuditService } from '../services/audit.service';
import { LoggingModule } from './logging.module';

@Module({
  imports: [PrismaModule, LoggingModule],
  providers: [AuditService],

  exports: [AuditService],
})
export class AuditModule {}
