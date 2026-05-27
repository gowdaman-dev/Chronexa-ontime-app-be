import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { AuditService } from '../services/audit.service';

@Module({
  imports: [PrismaModule],
  providers: [AuditService],

  exports: [AuditService],
})
export class AuditModule {}
