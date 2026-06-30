import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@app/auth';
import { ApiSelfServiceOperation } from '@app/dto/self-service.doc';
import { ApiReportFilters } from '@app/dto/self-service-filters.doc';
import { ReportGatewayService } from '../report-gateway.service';
import { renderReport } from '../report.helpers';

@ApiTags('Reports')
@Controller({ version: '1' })
export class ReportsController {
  constructor(private readonly reports: ReportGatewayService) {}

  @Get('report/attendance')
  @ApiSelfServiceOperation(
    'Attendance report from sp_employee_daily_report. Date filters are independent; omit dates for all matching rows.',
    ApiReportFilters(),
  )
  getAttendanceReport(
    @CurrentUser() user: AuthUser,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    return renderReport(this.reports, 'report.attendance', user, query, res);
  }

  @Get('report/daily')
  @ApiSelfServiceOperation('Daily report (JSON or HTML/PDF)', ApiReportFilters())
  getDailyReport(
    @CurrentUser() user: AuthUser,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    return renderReport(this.reports, 'report.daily', user, query, res);
  }

  @Get('report/weekly')
  @ApiSelfServiceOperation('Weekly report (JSON or HTML/PDF)', ApiReportFilters())
  getWeeklyReport(
    @CurrentUser() user: AuthUser,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    return renderReport(this.reports, 'report.weekly', user, query, res);
  }

  @Get('report/monthly')
  @ApiSelfServiceOperation('Monthly report (JSON or HTML/PDF)', ApiReportFilters())
  getMonthlyReport(
    @CurrentUser() user: AuthUser,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    return renderReport(this.reports, 'report.monthly', user, query, res);
  }
}
