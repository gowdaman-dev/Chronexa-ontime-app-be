import { Module } from '@nestjs/common';
import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/prisma';
import { LoggingModule } from '@app/common';
import { ReportCommonService } from './shared/report-common.service';
import { ReportQueryService } from './shared/report-query.service';
import { ReportPdfService } from './shared/report-pdf.service';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';
import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceService } from './attendance/attendance.service';

@Module({
  imports: [ConfigModule, PrismaModule, LoggingModule],
  controllers: [ReportsController, AttendanceController],
  providers: [
    ReportCommonService,
    ReportQueryService,
    ReportPdfService,
    ReportsService,
    AttendanceService,
  ],
})
export class ReportServiceModule {}
