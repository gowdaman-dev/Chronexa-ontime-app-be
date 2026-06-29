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
  ApiAddManualTransactionBody,
  ApiGroupApproveTransactionsBody,
  ApiGroupApproveByEmployeeIdsBody,
} from '@app/dto/self-service.doc';
import {
  ApiManualTransactionFilters,
  ApiManualTransactionApproveQuery,
  ApiManualTransactionRejectQuery,
} from '@app/dto/self-service-filters.doc';
import { SelfServiceGatewayService } from '../self-service.service';
import { serializeUploadFile, toUserPayload } from '../self-service.helpers';
import { getMulterUploadOptions } from '../../uploads/multer.options';

@ApiTags('Manual Transaction')
@Controller({ version: '1' })
export class ManualTransactionController {
  constructor(private readonly selfService: SelfServiceGatewayService) {}

  @Post('employeeManualTransaction/add')
  @UseInterceptors(FileInterceptor('attachment', getMulterUploadOptions()))
  @ApiSelfServiceOperation('Add manual movement transaction', ApiAddManualTransactionBody())
  addManualTransaction(
    @CurrentUser() user: AuthUser,
    @Body() body: any,
    @UploadedFile() file: any,
  ) {
    return this.selfService.workflow('self_service.manual_transactions.add', {
      user: toUserPayload(user),
      body,
      file: serializeUploadFile(file),
    });
  }

  @Get('employeeManualTransaction/all')
  @ApiSelfServiceOperation('Get all manual movement transactions', ApiManualTransactionFilters())
  getAllManualTransactions(@Query() query: any) {
    return this.selfService.workflow('self_service.manual_transactions.all', { query });
  }

  @Get('employeeManualTransaction/get/:id')
  @ApiSelfServiceOperation('Get manual movement transaction by ID', ApiSelfServiceIdParam())
  getManualTransaction(@Param('id') id: string) {
    return this.selfService.workflow('self_service.manual_transactions.get', { id: +id });
  }

  @Put('employeeManualTransaction/edit/:id')
  @UseInterceptors(FileInterceptor('attachment', getMulterUploadOptions()))
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
      file: serializeUploadFile(file),
    });
  }

  @Delete('employeeManualTransaction/delete')
  @ApiSelfServiceOperation(
    'Delete multiple manual movement transactions',
    ApiBulkDeleteBody('manual transaction'),
  )
  deleteManyManualTransactions(@Body() body: any) {
    return this.selfService.workflow('self_service.manual_transactions.delete_many', { body });
  }

  @Delete('employeeManualTransaction/delete/:id')
  @ApiSelfServiceOperation('Delete manual movement transaction by ID', ApiSelfServiceIdParam())
  deleteManualTransaction(@Param('id') id: string) {
    return this.selfService.workflow('self_service.manual_transactions.delete', { id: +id });
  }

  @Get('employeeManualTransaction/team/all')
  @ApiSelfServiceOperation('Get team manual movement transactions', ApiManualTransactionFilters())
  getTeamManualTransactions(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.manual_transactions.team_all', {
      user: toUserPayload(user),
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
      user: toUserPayload(user),
      query,
      body,
    });
  }

  @Put('employeeManualTransaction/reject')
  @ApiSelfServiceOperation('Reject manual movement transaction', ApiManualTransactionRejectQuery())
  rejectManualTransaction(@Query() query: any) {
    return this.selfService.workflow('self_service.manual_transactions.reject', { query });
  }

  @Put('employeeManualTransaction/groupApproveTransactions')
  @ApiSelfServiceOperation('Group approve manual transactions', ApiGroupApproveTransactionsBody())
  groupApproveManualTransactions(
    @CurrentUser() user: AuthUser,
    @Body() body: any,
  ) {
    return this.selfService.workflow('self_service.manual_transactions.group_approve', {
      user: toUserPayload(user),
      body,
    });
  }

  @Put('employeeManualTransaction/groupApproveByEmployeeIds')
  @UseInterceptors(FileInterceptor('attachment', getMulterUploadOptions()))
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
        user: toUserPayload(user),
        body,
        file: serializeUploadFile(file),
      },
    );
  }
}
