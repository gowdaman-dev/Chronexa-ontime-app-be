import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@app/auth';
import {
  IdsPunchDto,
  IdsVerifyEncounterDto,
  VerifyLocationDto,
} from '@app/dto';
import {
  ApiIdsPunchOperation,
  ApiIdsVerifyEncounterOperation,
  ApiLastTransactionsOperation,
  ApiSimpleSelfServiceReadOperation,
  ApiVerifyLocationOperation,
} from '@app/dto/self-service.doc';
import { SelfServiceGatewayService } from './self-service.service';

@ApiTags('Mobile Self Service')
@Controller({ version: '1' })
export class SelfServiceController {
  constructor(private readonly selfService: SelfServiceGatewayService) {}

  private serializeFile(file: any) {
    if (!file) return file;
    return {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferBase64: Buffer.isBuffer(file.buffer)
        ? file.buffer.toString('base64')
        : file.buffer,
    };
  }

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

  @Get('mobile/transactions/my-check-in-out')
  @ApiSimpleSelfServiceReadOperation('Get today check-in and check-out for current mobile employee')
  getMyCheckInOut(@CurrentUser() user: AuthUser) {
    return this.selfService.getMyCheckInOut(user.employeeId);
  }

  @Get('mobile/location/my-work-location')
  @ApiSimpleSelfServiceReadOperation('Get assigned work location for current mobile employee')
  getMyWorkLocation(@CurrentUser() user: AuthUser) {
    return this.selfService.getMyWorkLocation(user.employeeId);
  }

  @Get('mobile/transactions/last-transactions')
  @ApiLastTransactionsOperation()
  getLastTransactions(@CurrentUser() user: AuthUser) {
    return this.selfService.getLastTransactions(user.employeeId);
  }

  @Post('mobile/location/verify-assigned-location')
  @ApiVerifyLocationOperation('Verify coordinates against assigned work location')
  verifyAssignedLocation(
    @CurrentUser() user: AuthUser,
    @Body() dto: VerifyLocationDto,
  ) {
    return this.selfService.verifyAssignedLocation(user.employeeId, dto);
  }

  @Post('mobile/location/verify-location')
  @ApiVerifyLocationOperation('Verify coordinates against any configured work location')
  verifyLocation(@Body() dto: VerifyLocationDto) {
    return this.selfService.verifyLocation(dto);
  }

  @Get('org/spark/todayLocation')
  @ApiSimpleSelfServiceReadOperation('Get Spark today location for current employee')
  getSparkTodayLocation(@CurrentUser() user: AuthUser) {
    return this.selfService.getSparkTodayLocation(user.employeeId);
  }

  @Post('ids-punch/punch')
  @UseInterceptors(FileInterceptor('image'))
  @ApiIdsPunchOperation()
  punch(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: any,
    @Body() body: IdsPunchDto,
    @Req() req: any,
  ) {
    return this.selfService.punch({
      employeeId: user.employeeId,
      file: this.serializeFile(file),
      body,
      userAgent: req.headers?.['user-agent'],
      appVersion: req.headers?.['app-version'],
    });
  }

  @Post('ids-punch/verify-encounter')
  @UseInterceptors(FileInterceptor('image'))
  @ApiIdsVerifyEncounterOperation()
  verifyEncounter(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: any,
    @Body() body: IdsVerifyEncounterDto,
    @Req() req: any,
  ) {
    return this.selfService.verifyEncounter({
      employeeId: user.employeeId,
      file: this.serializeFile(file),
      body,
      userAgent: req.headers?.['user-agent'],
      appVersion: req.headers?.['app-version'],
    });
  }

  @Post('employeeLeave/add')
  @UseInterceptors(FileInterceptor('leave_doc'))
  @ApiSimpleSelfServiceReadOperation('Add employee leave request')
  addEmployeeLeave(
    @CurrentUser() user: AuthUser,
    @Body() body: any,
    @UploadedFile() file: any,
  ) {
    return this.selfService.workflow('self_service.leaves.add', {
      user: this.userPayload(user),
      body,
      file: this.serializeFile(file),
    });
  }

  @Get('employeeLeave/all')
  @ApiSimpleSelfServiceReadOperation('Get all employee leave requests')
  getAllEmployeeLeaves(@Query() query: any) {
    return this.selfService.workflow('self_service.leaves.all', { query });
  }

  @Get('employeeLeave/pending')
  @ApiSimpleSelfServiceReadOperation('Get pending leave requests')
  getPendingEmployeeLeaves(@Query() query: any) {
    return this.selfService.workflow('self_service.leaves.pending', { query });
  }

  @Get('employeeLeave/get/:id')
  @ApiSimpleSelfServiceReadOperation('Get leave request by ID')
  getEmployeeLeave(@Param('id') id: string) {
    return this.selfService.workflow('self_service.leaves.get', { id: +id });
  }

  @Get('employeeLeave/byEmployee/:id')
  @ApiSimpleSelfServiceReadOperation('Get leave requests by employee ID')
  getEmployeeLeavesByEmployee(@Param('id') id: string, @Query() query: any) {
    return this.selfService.workflow('self_service.leaves.by_employee', {
      id: +id,
      query,
    });
  }

  @Put('employeeLeave/approve/:id')
  @ApiSimpleSelfServiceReadOperation('Approve or reject leave request')
  approveEmployeeLeave(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.selfService.workflow('self_service.leaves.approve', {
      id: +id,
      body,
      user: this.userPayload(user),
    });
  }

  @Put('employeeLeave/edit/:id')
  @UseInterceptors(FileInterceptor('leave_doc'))
  @ApiSimpleSelfServiceReadOperation('Edit leave request')
  editEmployeeLeave(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file: any,
  ) {
    return this.selfService.workflow('self_service.leaves.edit', {
      id: +id,
      body,
      file: this.serializeFile(file),
      user: this.userPayload(user),
    });
  }

  @Delete('employeeLeave/delete')
  @ApiSimpleSelfServiceReadOperation('Delete multiple leave requests')
  deleteManyEmployeeLeaves(@Body() body: any) {
    return this.selfService.workflow('self_service.leaves.delete_many', { body });
  }

  @Delete('employeeLeave/delete/:id')
  @ApiSimpleSelfServiceReadOperation('Delete leave request by ID')
  deleteEmployeeLeave(@Param('id') id: string) {
    return this.selfService.workflow('self_service.leaves.delete', { id: +id });
  }

  @Get('employeeLeave/myleavesRequests')
  @ApiSimpleSelfServiceReadOperation('Get logged-in user leave requests')
  getMyLeaveRequests(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.leaves.my_requests', {
      user: this.userPayload(user),
      query,
    });
  }

  @Get('employeeLeave/team/all')
  @ApiSimpleSelfServiceReadOperation('Get team leave requests')
  getTeamLeaveRequests(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.leaves.team_all', {
      user: this.userPayload(user),
      query,
    });
  }

  @Post('employeeShortPermission/add')
  @ApiSimpleSelfServiceReadOperation('Add short permission request')
  addShortPermission(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.selfService.workflow('self_service.short_permissions.add', {
      user: this.userPayload(user),
      body,
    });
  }

  @Get('employeeShortPermission/all')
  @ApiSimpleSelfServiceReadOperation('Get all short permission requests')
  getAllShortPermissions(@Query() query: any) {
    return this.selfService.workflow('self_service.short_permissions.all', {
      query,
    });
  }

  @Get('employeeShortPermission/pending')
  @ApiSimpleSelfServiceReadOperation('Get pending short permissions')
  getPendingShortPermissions(@Query() query: any) {
    return this.selfService.workflow('self_service.short_permissions.pending', {
      query,
    });
  }

  @Get('employeeShortPermission/get/:id')
  @ApiSimpleSelfServiceReadOperation('Get short permission by ID')
  getShortPermission(@Param('id') id: string) {
    return this.selfService.workflow('self_service.short_permissions.get', {
      id: +id,
    });
  }

  @Get('employeeShortPermission/byEmployee/:id')
  @ApiSimpleSelfServiceReadOperation('Get short permissions by employee ID')
  getShortPermissionsByEmployee(@Param('id') id: string, @Query() query: any) {
    return this.selfService.workflow(
      'self_service.short_permissions.by_employee',
      {
        id: +id,
        query,
      },
    );
  }

  @Put('employeeShortPermission/approve/:id')
  @ApiSimpleSelfServiceReadOperation('Approve or reject short permission')
  approveShortPermission(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.selfService.workflow('self_service.short_permissions.approve', {
      id: +id,
      body,
      user: this.userPayload(user),
    });
  }

  @Put('employeeShortPermission/edit/:id')
  @ApiSimpleSelfServiceReadOperation('Edit short permission')
  editShortPermission(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.selfService.workflow('self_service.short_permissions.edit', {
      id: +id,
      body,
      user: this.userPayload(user),
    });
  }

  @Get('employeeShortPermission/search')
  @ApiSimpleSelfServiceReadOperation('Search short permission requests')
  searchShortPermissions(@Query() query: any) {
    return this.selfService.workflow('self_service.short_permissions.search', {
      query,
    });
  }

  @Delete('employeeShortPermission/delete')
  @ApiSimpleSelfServiceReadOperation('Delete multiple short permissions')
  deleteManyShortPermissions(@Body() body: any) {
    return this.selfService.workflow(
      'self_service.short_permissions.delete_many',
      { body },
    );
  }

  @Delete('employeeShortPermission/delete/:id')
  @ApiSimpleSelfServiceReadOperation('Delete short permission by ID')
  deleteShortPermission(@Param('id') id: string) {
    return this.selfService.workflow('self_service.short_permissions.delete', {
      id: +id,
    });
  }

  @Get('employeeShortPermission/team/all')
  @ApiSimpleSelfServiceReadOperation('Get team short permission requests')
  getTeamShortPermissions(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.short_permissions.team_all', {
      user: this.userPayload(user),
      query,
    });
  }

  @Get('missingMovement/all')
  @ApiSimpleSelfServiceReadOperation('Get all missing movements')
  getAllMissingMovements(@Query() query: any) {
    return this.selfService.workflow('self_service.missing_movements.all', {
      query,
    });
  }

  @Get('missingMovement/team/all')
  @ApiSimpleSelfServiceReadOperation('Get team missing movements')
  getTeamMissingMovements(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.missing_movements.team_all', {
      user: this.userPayload(user),
      query,
    });
  }

  @Post('employeeManualTransaction/add')
  @UseInterceptors(FileInterceptor('attachment'))
  @ApiSimpleSelfServiceReadOperation('Add manual movement transaction')
  addManualTransaction(
    @CurrentUser() user: AuthUser,
    @Body() body: any,
    @UploadedFile() file: any,
  ) {
    return this.selfService.workflow('self_service.manual_transactions.add', {
      user: this.userPayload(user),
      body,
      file: this.serializeFile(file),
    });
  }

  @Get('employeeManualTransaction/all')
  @ApiSimpleSelfServiceReadOperation('Get all manual movement transactions')
  getAllManualTransactions(@Query() query: any) {
    return this.selfService.workflow('self_service.manual_transactions.all', {
      query,
    });
  }

  @Get('employeeManualTransaction/get/:id')
  @ApiSimpleSelfServiceReadOperation('Get manual movement transaction by ID')
  getManualTransaction(@Param('id') id: string) {
    return this.selfService.workflow('self_service.manual_transactions.get', {
      id: +id,
    });
  }

  @Put('employeeManualTransaction/edit/:id')
  @UseInterceptors(FileInterceptor('attachment'))
  @ApiSimpleSelfServiceReadOperation('Edit manual movement transaction')
  editManualTransaction(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file: any,
  ) {
    return this.selfService.workflow('self_service.manual_transactions.edit', {
      id: +id,
      body,
      file: this.serializeFile(file),
    });
  }

  @Delete('employeeManualTransaction/delete')
  @ApiSimpleSelfServiceReadOperation('Delete multiple manual movement transactions')
  deleteManyManualTransactions(@Body() body: any) {
    return this.selfService.workflow(
      'self_service.manual_transactions.delete_many',
      { body },
    );
  }

  @Delete('employeeManualTransaction/delete/:id')
  @ApiSimpleSelfServiceReadOperation('Delete manual movement transaction by ID')
  deleteManualTransaction(@Param('id') id: string) {
    return this.selfService.workflow('self_service.manual_transactions.delete', {
      id: +id,
    });
  }

  @Get('employeeManualTransaction/team/all')
  @ApiSimpleSelfServiceReadOperation('Get team manual movement transactions')
  getTeamManualTransactions(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.manual_transactions.team_all', {
      user: this.userPayload(user),
      query,
    });
  }

  @Put('employeeManualTransaction/approve')
  @ApiSimpleSelfServiceReadOperation('Approve manual movement transaction')
  approveManualTransaction(
    @CurrentUser() user: AuthUser,
    @Query() query: any,
    @Body() body: any,
  ) {
    return this.selfService.workflow('self_service.manual_transactions.approve', {
      user: this.userPayload(user),
      query,
      body,
    });
  }

  @Put('employeeManualTransaction/reject')
  @ApiSimpleSelfServiceReadOperation('Reject manual movement transaction')
  rejectManualTransaction(@Query() query: any) {
    return this.selfService.workflow('self_service.manual_transactions.reject', {
      query,
    });
  }

  @Put('employeeManualTransaction/groupApproveTransactions')
  @ApiSimpleSelfServiceReadOperation('Group approve manual transactions')
  groupApproveManualTransactions(
    @CurrentUser() user: AuthUser,
    @Body() body: any,
  ) {
    return this.selfService.workflow(
      'self_service.manual_transactions.group_approve',
      {
        user: this.userPayload(user),
        body,
      },
    );
  }

  @Put('employeeManualTransaction/groupApproveByEmployeeIds')
  @UseInterceptors(FileInterceptor('attachment'))
  @ApiSimpleSelfServiceReadOperation('Create group manual transactions by employee IDs')
  groupApproveManualTransactionsByEmployeeIds(
    @CurrentUser() user: AuthUser,
    @Body() body: any,
    @UploadedFile() file: any,
  ) {
    return this.selfService.workflow(
      'self_service.manual_transactions.group_approve_by_employee_ids',
      {
        user: this.userPayload(user),
        body,
        file: this.serializeFile(file),
      },
    );
  }
}
