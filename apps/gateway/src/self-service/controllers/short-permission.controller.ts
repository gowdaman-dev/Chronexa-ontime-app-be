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
  ApiApproveRejectBody,
  ApiAddShortPermissionBody,
} from '@app/dto/self-service.doc';
import {
  ApiPaginationFilters,
  ApiShortPermissionListFilters,
} from '@app/dto/self-service-filters.doc';
import { SelfServiceGatewayService } from '../self-service.service';
import { toUserPayload } from '../self-service.helpers';

@ApiTags('Short Permission')
@Controller({ version: '1' })
export class ShortPermissionController {
  constructor(private readonly selfService: SelfServiceGatewayService) {}

  @Post('employeeShortPermission/add')
  @ApiSelfServiceOperation('Add short permission request', ApiAddShortPermissionBody())
  addShortPermission(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.selfService.workflow('self_service.short_permissions.add', {
      user: toUserPayload(user),
      body,
    });
  }

  @Get('employeeShortPermission/all')
  @ApiSelfServiceOperation('Get all short permission requests', ApiShortPermissionListFilters())
  getAllShortPermissions(@Query() query: any) {
    return this.selfService.workflow('self_service.short_permissions.all', { query });
  }

  @Get('employeeShortPermission/pending')
  @ApiSelfServiceOperation('Get pending short permissions', ApiPaginationFilters())
  getPendingShortPermissions(@Query() query: any) {
    return this.selfService.workflow('self_service.short_permissions.pending', { query });
  }

  @Get('employeeShortPermission/get/:id')
  @ApiSelfServiceOperation('Get short permission by ID', ApiSelfServiceIdParam())
  getShortPermission(@Param('id') id: string) {
    return this.selfService.workflow('self_service.short_permissions.get', { id: +id });
  }

  @Get('employeeShortPermission/byEmployee/:id')
  @ApiSelfServiceOperation(
    'Get short permissions by employee ID',
    ApiSelfServiceIdParam(),
    ApiShortPermissionListFilters(),
  )
  getShortPermissionsByEmployee(@Param('id') id: string, @Query() query: any) {
    return this.selfService.workflow('self_service.short_permissions.by_employee', {
      id: +id,
      query,
    });
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
      user: toUserPayload(user),
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
      user: toUserPayload(user),
    });
  }

  @Get('employeeShortPermission/search')
  @ApiSelfServiceOperation('Search short permission requests', ApiShortPermissionListFilters())
  searchShortPermissions(@Query() query: any) {
    return this.selfService.workflow('self_service.short_permissions.search', { query });
  }

  @Delete('employeeShortPermission/delete')
  @ApiSelfServiceOperation('Delete multiple short permissions', ApiBulkDeleteBody('short permission'))
  deleteManyShortPermissions(@Body() body: any) {
    return this.selfService.workflow('self_service.short_permissions.delete_many', { body });
  }

  @Delete('employeeShortPermission/delete/:id')
  @ApiSelfServiceOperation('Delete short permission by ID', ApiSelfServiceIdParam())
  deleteShortPermission(@Param('id') id: string) {
    return this.selfService.workflow('self_service.short_permissions.delete', { id: +id });
  }

  @Get('employeeShortPermission/team/all')
  @ApiSelfServiceOperation('Get team short permission requests', ApiShortPermissionListFilters())
  getTeamShortPermissions(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.short_permissions.team_all', {
      user: toUserPayload(user),
      query,
    });
  }
}
