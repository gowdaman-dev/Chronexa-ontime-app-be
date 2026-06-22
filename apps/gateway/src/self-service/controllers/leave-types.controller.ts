import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@app/auth';
import {
  ApiSelfServiceOperation,
  ApiSelfServiceIdParam,
  ApiBulkDeleteBody,
  ApiLeaveTypeBody,
} from '@app/dto/self-service.doc';
import {
  ApiLeaveTypeFilters,
  ApiPaginationFilters,
} from '@app/dto/self-service-filters.doc';
import { SelfServiceGatewayService } from '../self-service.service';
import { toUserPayload } from '../self-service.helpers';

@ApiTags('Leave Types')
@Controller({ version: '1' })
export class LeaveTypesController {
  constructor(private readonly selfService: SelfServiceGatewayService) {}

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
      user: toUserPayload(user),
      body,
    });
  }

  @Put('leaveType/edit/:id')
  @ApiSelfServiceOperation('Update leave type', ApiSelfServiceIdParam(), ApiLeaveTypeBody())
  editLeaveType(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.selfService.workflow('self_service.leave_types.edit', {
      id: +id,
      user: toUserPayload(user),
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
}
