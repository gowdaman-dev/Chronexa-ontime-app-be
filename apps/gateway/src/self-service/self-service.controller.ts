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
  ApiSelfServiceOperation,
  ApiSimpleSelfServiceReadOperation,
  ApiVerifyLocationOperation,
  ApiSelfServiceIdParam,
  ApiBulkDeleteBody,
  ApiApproveRejectBody,
  ApiAddLeaveBody,
  ApiAddShortPermissionBody,
  ApiAddManualTransactionBody,
  ApiGroupApproveTransactionsBody,
  ApiGroupApproveByEmployeeIdsBody,
} from '@app/dto/self-service.doc';
import {
  ApiPaginationFilters,
  ApiLeaveListFilters,
  ApiShortPermissionListFilters,
  ApiMissingMovementFilters,
  ApiManualTransactionFilters,
  ApiManualTransactionApproveQuery,
  ApiManualTransactionRejectQuery,
} from '@app/dto/self-service-filters.doc';
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
  @ApiSelfServiceOperation('Add employee leave request', ApiAddLeaveBody())
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
  @ApiSelfServiceOperation('Get all employee leave requests', ApiLeaveListFilters())
  getAllEmployeeLeaves(@Query() query: any) {
    return this.selfService.workflow('self_service.leaves.all', { query });
  }

  @Get('employeeLeave/pending')
  @ApiSelfServiceOperation('Get pending leave requests', ApiPaginationFilters())
  getPendingEmployeeLeaves(@Query() query: any) {
    return this.selfService.workflow('self_service.leaves.pending', { query });
  }

  @Get('employeeLeave/get/:id')
  @ApiSelfServiceOperation('Get leave request by ID', ApiSelfServiceIdParam())
  getEmployeeLeave(@Param('id') id: string) {
    return this.selfService.workflow('self_service.leaves.get', { id: +id });
  }

  @Get('employeeLeave/byEmployee/:id')
  @ApiSelfServiceOperation(
    'Get leave requests by employee ID',
    ApiSelfServiceIdParam(),
    ApiLeaveListFilters(),
  )
  getEmployeeLeavesByEmployee(@Param('id') id: string, @Query() query: any) {
    return this.selfService.workflow('self_service.leaves.by_employee', {
      id: +id,
      query,
    });
  }

  @Put('employeeLeave/approve/:id')
  @ApiSelfServiceOperation(
    'Approve or reject leave request',
    ApiSelfServiceIdParam(),
    ApiApproveRejectBody(),
  )
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
  @ApiSelfServiceOperation('Edit leave request', ApiSelfServiceIdParam(), ApiAddLeaveBody())
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
  @ApiSelfServiceOperation('Delete multiple leave requests', ApiBulkDeleteBody('employee leave'))
  deleteManyEmployeeLeaves(@Body() body: any) {
    return this.selfService.workflow('self_service.leaves.delete_many', { body });
  }

  @Delete('employeeLeave/delete/:id')
  @ApiSelfServiceOperation('Delete leave request by ID', ApiSelfServiceIdParam())
  deleteEmployeeLeave(@Param('id') id: string) {
    return this.selfService.workflow('self_service.leaves.delete', { id: +id });
  }

  @Get('employeeLeave/myleavesRequests')
  @ApiSelfServiceOperation('Get logged-in user leave requests', ApiPaginationFilters())
  getMyLeaveRequests(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.leaves.my_requests', {
      user: this.userPayload(user),
      query,
    });
  }

  @Get('employeeLeave/team/all')
  @ApiSelfServiceOperation('Get team leave requests', ApiLeaveListFilters())
  getTeamLeaveRequests(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.leaves.team_all', {
      user: this.userPayload(user),
      query,
    });
  }

  @Post('employeeShortPermission/add')
  @ApiSelfServiceOperation('Add short permission request', ApiAddShortPermissionBody())
  addShortPermission(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.selfService.workflow('self_service.short_permissions.add', {
      user: this.userPayload(user),
      body,
    });
  }

  @Get('employeeShortPermission/all')
  @ApiSelfServiceOperation('Get all short permission requests', ApiShortPermissionListFilters())
  getAllShortPermissions(@Query() query: any) {
    return this.selfService.workflow('self_service.short_permissions.all', {
      query,
    });
  }

  @Get('employeeShortPermission/pending')
  @ApiSelfServiceOperation('Get pending short permissions', ApiPaginationFilters())
  getPendingShortPermissions(@Query() query: any) {
    return this.selfService.workflow('self_service.short_permissions.pending', {
      query,
    });
  }

  @Get('employeeShortPermission/get/:id')
  @ApiSelfServiceOperation('Get short permission by ID', ApiSelfServiceIdParam())
  getShortPermission(@Param('id') id: string) {
    return this.selfService.workflow('self_service.short_permissions.get', {
      id: +id,
    });
  }

  @Get('employeeShortPermission/byEmployee/:id')
  @ApiSelfServiceOperation(
    'Get short permissions by employee ID',
    ApiSelfServiceIdParam(),
    ApiShortPermissionListFilters(),
  )
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
  @ApiSelfServiceOperation(
    'Approve or reject short permission',
    ApiSelfServiceIdParam(),
    ApiApproveRejectBody(),
  )
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
  @ApiSelfServiceOperation(
    'Edit short permission',
    ApiSelfServiceIdParam(),
    ApiAddShortPermissionBody(),
  )
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
  @ApiSelfServiceOperation('Search short permission requests', ApiShortPermissionListFilters())
  searchShortPermissions(@Query() query: any) {
    return this.selfService.workflow('self_service.short_permissions.search', {
      query,
    });
  }

  @Delete('employeeShortPermission/delete')
  @ApiSelfServiceOperation('Delete multiple short permissions', ApiBulkDeleteBody('short permission'))
  deleteManyShortPermissions(@Body() body: any) {
    return this.selfService.workflow(
      'self_service.short_permissions.delete_many',
      { body },
    );
  }

  @Delete('employeeShortPermission/delete/:id')
  @ApiSelfServiceOperation('Delete short permission by ID', ApiSelfServiceIdParam())
  deleteShortPermission(@Param('id') id: string) {
    return this.selfService.workflow('self_service.short_permissions.delete', {
      id: +id,
    });
  }

  @Get('employeeShortPermission/team/all')
  @ApiSelfServiceOperation('Get team short permission requests', ApiShortPermissionListFilters())
  getTeamShortPermissions(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.short_permissions.team_all', {
      user: this.userPayload(user),
      query,
    });
  }

  @Get('missingMovement/all')
  @ApiSelfServiceOperation('Get all missing movements', ApiMissingMovementFilters())
  getAllMissingMovements(@Query() query: any) {
    return this.selfService.workflow('self_service.missing_movements.all', {
      query,
    });
  }

  @Get('missingMovement/team/all')
  @ApiSelfServiceOperation('Get team missing movements', ApiMissingMovementFilters())
  getTeamMissingMovements(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.missing_movements.team_all', {
      user: this.userPayload(user),
      query,
    });
  }

  @Post('employeeManualTransaction/add')
  @UseInterceptors(FileInterceptor('attachment'))
  @ApiSelfServiceOperation('Add manual movement transaction', ApiAddManualTransactionBody())
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
  @ApiSelfServiceOperation('Get all manual movement transactions', ApiManualTransactionFilters())
  getAllManualTransactions(@Query() query: any) {
    return this.selfService.workflow('self_service.manual_transactions.all', {
      query,
    });
  }

  @Get('employeeManualTransaction/get/:id')
  @ApiSelfServiceOperation('Get manual movement transaction by ID', ApiSelfServiceIdParam())
  getManualTransaction(@Param('id') id: string) {
    return this.selfService.workflow('self_service.manual_transactions.get', {
      id: +id,
    });
  }

  @Put('employeeManualTransaction/edit/:id')
  @UseInterceptors(FileInterceptor('attachment'))
  @ApiSelfServiceOperation(
    'Edit manual movement transaction',
    ApiSelfServiceIdParam(),
    ApiAddManualTransactionBody(),
  )
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
  @ApiSelfServiceOperation(
    'Delete multiple manual movement transactions',
    ApiBulkDeleteBody('manual transaction'),
  )
  deleteManyManualTransactions(@Body() body: any) {
    return this.selfService.workflow(
      'self_service.manual_transactions.delete_many',
      { body },
    );
  }

  @Delete('employeeManualTransaction/delete/:id')
  @ApiSelfServiceOperation('Delete manual movement transaction by ID', ApiSelfServiceIdParam())
  deleteManualTransaction(@Param('id') id: string) {
    return this.selfService.workflow('self_service.manual_transactions.delete', {
      id: +id,
    });
  }

  @Get('employeeManualTransaction/team/all')
  @ApiSelfServiceOperation('Get team manual movement transactions', ApiManualTransactionFilters())
  getTeamManualTransactions(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.manual_transactions.team_all', {
      user: this.userPayload(user),
      query,
    });
  }

  @Put('employeeManualTransaction/approve')
  @ApiSelfServiceOperation(
    'Approve manual movement transaction',
    ApiManualTransactionApproveQuery(),
  )
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
  @ApiSelfServiceOperation('Reject manual movement transaction', ApiManualTransactionRejectQuery())
  rejectManualTransaction(@Query() query: any) {
    return this.selfService.workflow('self_service.manual_transactions.reject', {
      query,
    });
  }

  @Put('employeeManualTransaction/groupApproveTransactions')
  @ApiSelfServiceOperation('Group approve manual transactions', ApiGroupApproveTransactionsBody())
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
  @ApiSelfServiceOperation(
    'Create group manual transactions by employee IDs',
    ApiGroupApproveByEmployeeIdsBody(),
  )
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
