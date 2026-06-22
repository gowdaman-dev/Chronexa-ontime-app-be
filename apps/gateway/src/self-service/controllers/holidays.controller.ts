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
  ApiHolidayBody,
} from '@app/dto/self-service.doc';
import {
  ApiHolidayFilters,
  ApiHolidayUpcomingFilters,
  ApiPaginationFilters,
} from '@app/dto/self-service-filters.doc';
import { SelfServiceGatewayService } from '../self-service.service';
import { toUserPayload } from '../self-service.helpers';

@ApiTags('Holidays')
@Controller({ version: '1' })
export class HolidaysController {
  constructor(private readonly selfService: SelfServiceGatewayService) {}

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
      user: toUserPayload(user),
      body,
    });
  }

  @Put('holiday/edit/:id')
  @ApiSelfServiceOperation('Update holiday', ApiSelfServiceIdParam(), ApiHolidayBody())
  editHoliday(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.selfService.workflow('self_service.holidays.edit', {
      id: +id,
      user: toUserPayload(user),
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
}
