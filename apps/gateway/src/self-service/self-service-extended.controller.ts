import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@app/auth';
import {
  ApiSelfServiceOperation,
  ApiSelfServiceIdParam,
  ApiSelfServiceEmployeeIdParam,
  ApiSelfServiceGenderParam,
  ApiBulkDeleteBody,
  ApiLeaveTypeBody,
  ApiPermissionTypeBody,
  ApiHolidayBody,
  ApiAddEventTransactionBody,
  ApiAddEventTransactionSubjectBody,
  ApiVerifyEventTransactionBody,
} from '@app/dto/self-service.doc';
import {
  ApiLeaveTypeFilters,
  ApiPermissionTypeFilters,
  ApiHolidayFilters,
  ApiHolidayUpcomingFilters,
  ApiEventTransactionFilters,
  ApiTodayStatusFilters,
  ApiReportFilters,
  ApiPaginationFilters,
} from '@app/dto/self-service-filters.doc';
import { SelfServiceGatewayService } from './self-service.service';

@ApiTags('Self Service Extended')
@Controller({ version: '1' })
export class SelfServiceExtendedController {
  constructor(private readonly selfService: SelfServiceGatewayService) {}

  private userPayload(user: AuthUser) {
    return {
      userId: user.userId,
      employeeId: user.employeeId,
      login: user.login,
      role: user.role,
      employeeType: user.employeeType,
      isADUser: user.isADUser,
    };
  }

  @Get('leaveType/all')
  @ApiSelfServiceOperation('List all leave types', ApiLeaveTypeFilters())
  getAllLeaveTypes(@Query() query: any) {
    return this.selfService.workflow('self_service.leave_types.all', { query });
  }

  @Get('leaveType/active')
  @ApiSelfServiceOperation('List active leave types', ApiPaginationFilters())
  getActiveLeaveTypes() {
    return this.selfService.workflow('self_service.leave_types.active', {});
  }

  @Get('leaveType')
  @ApiSelfServiceOperation('Leave type dropdown list', ApiPaginationFilters())
  getLeaveTypesDropdown() {
    return this.selfService.workflow('self_service.leave_types.dropdown', {});
  }

  @Get('leaveType/get/:id')
  @ApiSelfServiceOperation('Get leave type by ID', ApiSelfServiceIdParam())
  getLeaveType(@Param('id') id: string) {
    return this.selfService.workflow('self_service.leave_types.get', { id: +id });
  }

  @Post('leaveType/add')
  @ApiSelfServiceOperation('Create leave type', ApiLeaveTypeBody())
  addLeaveType(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.selfService.workflow('self_service.leave_types.add', {
      user: this.userPayload(user),
      body,
    });
  }

  @Put('leaveType/edit/:id')
  @ApiSelfServiceOperation('Update leave type', ApiSelfServiceIdParam(), ApiLeaveTypeBody())
  editLeaveType(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.selfService.workflow('self_service.leave_types.edit', {
      id: +id,
      user: this.userPayload(user),
      body,
    });
  }

  @Delete('leaveType/delete/:id')
  @ApiSelfServiceOperation('Delete leave type by ID', ApiSelfServiceIdParam())
  deleteLeaveType(@Param('id') id: string) {
    return this.selfService.workflow('self_service.leave_types.delete', { id: +id });
  }

  @Delete('leaveType/delete')
  @ApiSelfServiceOperation('Bulk delete leave types', ApiBulkDeleteBody('leave type'))
  deleteManyLeaveTypes(@Body() body: any) {
    return this.selfService.workflow('self_service.leave_types.delete_many', { body });
  }

  @Get('permissionType/all')
  @ApiSelfServiceOperation('List all permission types', ApiPermissionTypeFilters())
  getAllPermissionTypes(@Query() query: any) {
    return this.selfService.workflow('self_service.permission_types.all', { query });
  }

  @Get('permissionType/active')
  @ApiSelfServiceOperation('List active permission types', ApiPaginationFilters())
  getActivePermissionTypes() {
    return this.selfService.workflow('self_service.permission_types.active', {});
  }

  @Get('permissionType/byGender/:gender')
  @ApiSelfServiceOperation('Permission types by gender', ApiSelfServiceGenderParam(), ApiPaginationFilters())
  getPermissionTypesByGender(@Param('gender') gender: string) {
    return this.selfService.workflow('self_service.permission_types.by_gender', { gender });
  }

  @Get('permissionType/search')
  @ApiSelfServiceOperation('Search permission types', ApiPermissionTypeFilters())
  searchPermissionTypes(@Query() query: any) {
    return this.selfService.workflow('self_service.permission_types.search', { query });
  }

  @Get('permissionType/get/:id')
  @ApiSelfServiceOperation('Get permission type by ID', ApiSelfServiceIdParam())
  getPermissionType(@Param('id') id: string) {
    return this.selfService.workflow('self_service.permission_types.get', { id: +id });
  }

  @Post('permissionType/add')
  @ApiSelfServiceOperation('Create permission type', ApiPermissionTypeBody())
  addPermissionType(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.selfService.workflow('self_service.permission_types.add', {
      user: this.userPayload(user),
      body,
    });
  }

  @Put('permissionType/edit/:id')
  @ApiSelfServiceOperation(
    'Update permission type',
    ApiSelfServiceIdParam(),
    ApiPermissionTypeBody(),
  )
  editPermissionType(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.selfService.workflow('self_service.permission_types.edit', {
      id: +id,
      user: this.userPayload(user),
      body,
    });
  }

  @Delete('permissionType/delete/:id')
  @ApiSelfServiceOperation('Delete permission type by ID', ApiSelfServiceIdParam())
  deletePermissionType(@Param('id') id: string) {
    return this.selfService.workflow('self_service.permission_types.delete', { id: +id });
  }

  @Delete('permissionType/delete')
  @ApiSelfServiceOperation('Bulk delete permission types', ApiBulkDeleteBody('permission type'))
  deleteManyPermissionTypes(@Body() body: any) {
    return this.selfService.workflow('self_service.permission_types.delete_many', { body });
  }

  @Get('holiday/all')
  @ApiSelfServiceOperation('List all holidays', ApiHolidayFilters())
  getAllHolidays(@Query() query: any) {
    return this.selfService.workflow('self_service.holidays.all', { query });
  }

  @Get('holiday/upcoming')
  @ApiSelfServiceOperation('Upcoming holidays', ApiHolidayUpcomingFilters(), ApiPaginationFilters())
  getUpcomingHolidays(@Query() query: any) {
    return this.selfService.workflow('self_service.holidays.upcoming', { query });
  }

  @Get('holiday/search')
  @ApiSelfServiceOperation('Search holidays', ApiHolidayFilters())
  searchHolidays(@Query() query: any) {
    return this.selfService.workflow('self_service.holidays.search', { query });
  }

  @Get('holiday/get/:id')
  @ApiSelfServiceOperation('Get holiday by ID', ApiSelfServiceIdParam())
  getHoliday(@Param('id') id: string) {
    return this.selfService.workflow('self_service.holidays.get', { id: +id });
  }

  @Post('holiday/add')
  @ApiSelfServiceOperation('Create holiday', ApiHolidayBody())
  addHoliday(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.selfService.workflow('self_service.holidays.add', {
      user: this.userPayload(user),
      body,
    });
  }

  @Put('holiday/edit/:id')
  @ApiSelfServiceOperation('Update holiday', ApiSelfServiceIdParam(), ApiHolidayBody())
  editHoliday(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.selfService.workflow('self_service.holidays.edit', {
      id: +id,
      user: this.userPayload(user),
      body,
    });
  }

  @Delete('holiday/delete/:id')
  @ApiSelfServiceOperation('Delete holiday by ID', ApiSelfServiceIdParam())
  deleteHoliday(@Param('id') id: string) {
    return this.selfService.workflow('self_service.holidays.delete', { id: +id });
  }

  @Delete('holiday/delete')
  @ApiSelfServiceOperation('Bulk delete holidays', ApiBulkDeleteBody('holiday'))
  deleteManyHolidays(@Body() body: any) {
    return this.selfService.workflow('self_service.holidays.delete_many', { body });
  }

  @Post('employeeEventTransaction/add')
  @ApiSelfServiceOperation('Create employee event transaction', ApiAddEventTransactionBody())
  addEventTransaction(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.selfService.workflow('self_service.event_transactions.add', {
      user: this.userPayload(user),
      body,
    });
  }

  @Post('employeeEventTransaction/addWithSubjectId')
  @ApiSelfServiceOperation(
    'Create event transaction by employee number (subject_id)',
    ApiAddEventTransactionSubjectBody(),
  )
  addEventTransactionWithSubjectId(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.selfService.workflow('self_service.event_transactions.add_with_subject_id', {
      user: this.userPayload(user),
      body,
    });
  }

  @Post('employeeEventTransaction/verify')
  @ApiSelfServiceOperation(
    'Geo-fenced punch: verify location and create event transaction',
    ApiVerifyEventTransactionBody(),
  )
  verifyEventTransaction(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.selfService.workflow('self_service.event_transactions.verify', {
      user: this.userPayload(user),
      body,
    });
  }

  @Get('employeeEventTransaction/all')
  @ApiSelfServiceOperation('List all event transactions', ApiEventTransactionFilters())
  getAllEventTransactions(@Query() query: any) {
    return this.selfService.workflow('self_service.event_transactions.all', { query });
  }

  @Get('employeeEventTransaction/get/:id')
  @ApiSelfServiceOperation('Get event transaction by ID', ApiSelfServiceIdParam())
  getEventTransaction(@Param('id') id: string) {
    return this.selfService.workflow('self_service.event_transactions.get', { id: +id });
  }

  @Get('employeeEventTransaction/employee/:employeeId')
  @ApiSelfServiceOperation(
    'Event transactions by employee',
    ApiSelfServiceEmployeeIdParam(),
    ApiEventTransactionFilters(),
  )
  getEventTransactionsByEmployee(@Param('employeeId') employeeId: string, @Query() query: any) {
    return this.selfService.workflow('self_service.event_transactions.by_employee', {
      id: +employeeId,
      query,
    });
  }

  @Get('employeeEventTransaction/team/all')
  @ApiSelfServiceOperation('Team event transactions', ApiEventTransactionFilters())
  getTeamEventTransactions(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.event_transactions.team_all', {
      user: this.userPayload(user),
      query,
    });
  }

  @Put('employeeEventTransaction/edit/:id')
  @ApiSelfServiceOperation(
    'Update event transaction',
    ApiSelfServiceIdParam(),
    ApiAddEventTransactionBody(),
  )
  editEventTransaction(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.selfService.workflow('self_service.event_transactions.edit', {
      id: +id,
      user: this.userPayload(user),
      body,
    });
  }

  @Delete('employeeEventTransaction/delete/:id')
  @ApiSelfServiceOperation('Delete event transaction by ID', ApiSelfServiceIdParam())
  deleteEventTransaction(@Param('id') id: string) {
    return this.selfService.workflow('self_service.event_transactions.delete', { id: +id });
  }

  @Delete('employeeEventTransaction/delete')
  @ApiSelfServiceOperation('Bulk delete event transactions', ApiBulkDeleteBody('event transaction'))
  deleteManyEventTransactions(@Body() body: any) {
    return this.selfService.workflow('self_service.event_transactions.delete_many', { body });
  }

  @Get('employeeEventTransaction/mylasttransaction/:id')
  @ApiSelfServiceOperation('My last event transaction', ApiSelfServiceIdParam())
  myLastEventTransactions(@Param('id') id: string) {
    return this.selfService.workflow('self_service.event_transactions.my_last', { id: +id });
  }

  @Get('employeeEventTransaction/employee/last/:employeeId')
  @ApiSelfServiceOperation('Last event transaction by employee', ApiSelfServiceEmployeeIdParam())
  getEmployeeLastEventTransaction(@Param('employeeId') employeeId: string) {
    return this.selfService.workflow('self_service.event_transactions.last', {
      employeeId: +employeeId,
    });
  }

  @Get('employeeEventTransaction/punchStatus')
  @ApiSelfServiceOperation('Current punch status', ApiPaginationFilters())
  getPunchStatus(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.event_transactions.punch_status', {
      user: this.userPayload(user),
      query,
    });
  }

  @Get('employeeEventTransaction/todayStatus')
  @ApiSelfServiceOperation('Today schedule and holiday status', ApiTodayStatusFilters())
  getTodayStatus(@Query() query: any) {
    return this.selfService.workflow('self_service.event_transactions.today_status', { query });
  }

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
    return this.renderReport('self_service.reports.attendance', user, query, res);
  }

  @Get('report/daily')
  @ApiSelfServiceOperation('Daily report (JSON or HTML/PDF)', ApiReportFilters())
  getDailyReport(@CurrentUser() user: AuthUser, @Query() query: any, @Res({ passthrough: true }) res: Response) {
    return this.renderReport('self_service.reports.daily', user, query, res);
  }

  @Get('report/weekly')
  @ApiSelfServiceOperation('Weekly report (JSON or HTML/PDF)', ApiReportFilters())
  getWeeklyReport(@CurrentUser() user: AuthUser, @Query() query: any, @Res({ passthrough: true }) res: Response) {
    return this.renderReport('self_service.reports.weekly', user, query, res);
  }

  @Get('report/monthly')
  @ApiSelfServiceOperation('Monthly report (JSON or HTML/PDF)', ApiReportFilters())
  getMonthlyReport(@CurrentUser() user: AuthUser, @Query() query: any, @Res({ passthrough: true }) res: Response) {
    return this.renderReport('self_service.reports.monthly', user, query, res);
  }

  private async renderReport(
    pattern: string,
    user: AuthUser,
    query: any,
    res: Response,
  ) {
    const result: any = await this.selfService.workflow(pattern, {
      user: this.userPayload(user),
      query,
    });
    const format = String(query?.format ?? 'json').toLowerCase();
    const period = pattern.split('.').pop() ?? 'report';
    if (format === 'pdf' && result?.pdfBase64) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${period}-attendance-report.pdf"`,
      );
      res.send(Buffer.from(result.pdfBase64, 'base64'));
      return;
    }
    if (format === 'html' && result?.html) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${period}-report.html"`,
      );
      res.send(result.html);
      return;
    }
    return result;
  }
}
