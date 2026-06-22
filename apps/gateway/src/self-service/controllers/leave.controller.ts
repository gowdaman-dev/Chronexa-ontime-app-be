import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@app/auth';
import {
  ApiSelfServiceOperation,
  ApiSelfServiceIdParam,
  ApiBulkDeleteBody,
  ApiApproveRejectBody,
  ApiAddLeaveBody,
} from '@app/dto/self-service.doc';
import {
  ApiPaginationFilters,
  ApiLeaveListFilters,
} from '@app/dto/self-service-filters.doc';
import { SelfServiceGatewayService } from '../self-service.service';
import { serializeUploadFile, toUserPayload } from '../self-service.helpers';

@ApiTags('Employee Leave')
@Controller({ version: '1' })
export class LeaveController {
  constructor(private readonly selfService: SelfServiceGatewayService) {}

  @Post('employeeLeave/add')
  @UseInterceptors(FileInterceptor('leave_doc'))
  @ApiSelfServiceOperation('Add employee leave request', ApiAddLeaveBody())
  addEmployeeLeave(
    @CurrentUser() user: AuthUser,
    @Body() body: any,
    @UploadedFile() file: any,
  ) {
    return this.selfService.workflow('self_service.leaves.add', {
      user: toUserPayload(user),
      body,
      file: serializeUploadFile(file),
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
      user: toUserPayload(user),
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
      file: serializeUploadFile(file),
      user: toUserPayload(user),
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
      user: toUserPayload(user),
      query,
    });
  }

  @Get('employeeLeave/team/all')
  @ApiSelfServiceOperation('Get team leave requests', ApiLeaveListFilters())
  getTeamLeaveRequests(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.leaves.team_all', {
      user: toUserPayload(user),
      query,
    });
  }
}
