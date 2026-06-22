import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@app/auth';
import { ApiSelfServiceOperation } from '@app/dto/self-service.doc';
import { ApiReportFilters } from '@app/dto/self-service-filters.doc';
import { SelfServiceGatewayService } from '../self-service.service';
import { renderSelfServiceReport } from '../self-service.helpers';

@ApiTags('Reports')
@Controller({ version: '1' })
export class ReportsController {
  constructor(private readonly selfService: SelfServiceGatewayService) {}

  @Get('report/attendance')
  @ApiSelfServiceOperation(
    'Daily attendance report from sp_employee_daily_report',
    ApiReportFilters(),
  )
  getAttendanceReport(
    @CurrentUser() user: AuthUser,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    return renderSelfServiceReport(
      this.selfService,
      'self_service.reports.attendance',
      user,
      query,
      res,
    );
  }

  @Get('report/daily')
  @ApiSelfServiceOperation('Daily report (JSON or HTML/PDF)', ApiReportFilters())
  getDailyReport(
    @CurrentUser() user: AuthUser,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    return renderSelfServiceReport(
      this.selfService,
      'self_service.reports.daily',
      user,
      query,
      res,
    );
  }

  @Get('report/weekly')
  @ApiSelfServiceOperation('Weekly report (JSON or HTML/PDF)', ApiReportFilters())
  getWeeklyReport(
    @CurrentUser() user: AuthUser,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    return renderSelfServiceReport(
      this.selfService,
      'self_service.reports.weekly',
      user,
      query,
      res,
    );
  }

  @Get('report/monthly')
  @ApiSelfServiceOperation('Monthly report (JSON or HTML/PDF)', ApiReportFilters())
  getMonthlyReport(
    @CurrentUser() user: AuthUser,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    return renderSelfServiceReport(
      this.selfService,
      'self_service.reports.monthly',
      user,
      query,
      res,
    );
  }
}
