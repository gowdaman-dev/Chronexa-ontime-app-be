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
  ApiSelfServiceGenderParam,
  ApiBulkDeleteBody,
  ApiPermissionTypeBody,
} from '@app/dto/self-service.doc';
import {
  ApiPermissionTypeFilters,
  ApiPaginationFilters,
} from '@app/dto/self-service-filters.doc';
import { SelfServiceGatewayService } from '../self-service.service';
import { toUserPayload } from '../self-service.helpers';

@ApiTags('Permission Types')
@Controller({ version: '1' })
export class PermissionTypesController {
  constructor(private readonly selfService: SelfServiceGatewayService) {}

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
  @ApiSelfServiceOperation(
    'Permission types by gender',
    ApiSelfServiceGenderParam(),
    ApiPaginationFilters(),
  )
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
      user: toUserPayload(user),
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
      user: toUserPayload(user),
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
}
