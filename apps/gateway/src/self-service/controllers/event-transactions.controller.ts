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
  ApiSelfServiceEmployeeIdParam,
  ApiBulkDeleteBody,
  ApiAddEventTransactionBody,
  ApiAddEventTransactionSubjectBody,
  ApiVerifyEventTransactionBody,
} from '@app/dto/self-service.doc';
import {
  ApiEventTransactionFilters,
  ApiTodayStatusFilters,
  ApiPunchStatusFilters,
} from '@app/dto/self-service-filters.doc';
import { SelfServiceGatewayService } from '../self-service.service';
import { toUserPayload } from '../self-service.helpers';

@ApiTags('Event Transactions')
@Controller({ version: '1' })
export class EventTransactionsController {
  constructor(private readonly selfService: SelfServiceGatewayService) {}

  @Post('employeeEventTransaction/add')
  @ApiSelfServiceOperation('Create employee event transaction', ApiAddEventTransactionBody())
  addEventTransaction(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.selfService.workflow('self_service.event_transactions.add', {
      user: toUserPayload(user),
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
      user: toUserPayload(user),
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
      user: toUserPayload(user),
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
      user: toUserPayload(user),
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
      user: toUserPayload(user),
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
  @ApiSelfServiceOperation(
    'My last event transaction',
    ApiSelfServiceIdParam('id', 'Employee ID'),
  )
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
  @ApiSelfServiceOperation('Current punch status', ApiPunchStatusFilters())
  getPunchStatus(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.selfService.workflow('self_service.event_transactions.punch_status', {
      user: toUserPayload(user),
      query,
    });
  }

  @Get('employeeEventTransaction/todayStatus')
  @ApiSelfServiceOperation('Today schedule and holiday status', ApiTodayStatusFilters())
  getTodayStatus(@Query() query: any) {
    return this.selfService.workflow('self_service.event_transactions.today_status', { query });
  }
}
