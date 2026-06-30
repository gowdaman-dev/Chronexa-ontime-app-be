import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '@app/auth';
import { UserServiceService } from '../user-service/user-service.service';
import { CreateEmployeeDto, UpdateEmployeeDto, PaginationQueryDto } from '@app/dto';
import {
  ApiCreateEmployeeOperation,
  ApiGetAllEmployeesOperation,
  ApiGetEmployeeByIdOperation,
  ApiUpdateEmployeeOperation,
  ApiDeleteEmployeeOperation,
  ApiGetDepartmentLookupsOperation,
  ApiGetDesignationLookupsOperation,
  ApiGetOrganizationLookupsOperation,
  ApiGetCitizenshipLookupsOperation,
} from '@app/dto/employee.doc';
import { ApiPaginationQueryParams } from '@app/dto/pagination.doc';

@ApiTags('Employee Management')
@Controller({ path: 'employees', version: '1' })
export class EmployeeServiceController {
  constructor(private readonly userService: UserServiceService) {}

  @Post()
  @Roles('Admin')
  @ApiCreateEmployeeOperation()
  create(@Body() dto: CreateEmployeeDto) {
    return this.userService.createEmployee(dto);
  }

  @Get()
  @ApiGetAllEmployeesOperation()
  @ApiPaginationQueryParams()
  findAll(@Query() query: PaginationQueryDto) {
    return this.userService.findAllEmployees(query.limit, query.offset);
  }

  @Get('lookups/departments')
  @ApiGetDepartmentLookupsOperation()
  @ApiPaginationQueryParams()
  @ApiQuery({ name: 'search', required: false, description: 'Search by code or name' })
  getDepartmentLookups(@Query() query: PaginationQueryDto & { search?: string }) {
    return this.userService.getDepartmentLookups(query);
  }

  @Get('lookups/designations')
  @ApiGetDesignationLookupsOperation()
  @ApiPaginationQueryParams()
  @ApiQuery({ name: 'search', required: false, description: 'Search by code or name' })
  getDesignationLookups(@Query() query: PaginationQueryDto & { search?: string }) {
    return this.userService.getDesignationLookups(query);
  }

  @Get('lookups/organizations')
  @ApiGetOrganizationLookupsOperation()
  @ApiPaginationQueryParams()
  @ApiQuery({ name: 'search', required: false, description: 'Search by code or name' })
  getOrganizationLookups(@Query() query: PaginationQueryDto & { search?: string }) {
    return this.userService.getOrganizationLookups(query);
  }

  @Get('lookups/citizenships')
  @ApiGetCitizenshipLookupsOperation()
  @ApiPaginationQueryParams()
  @ApiQuery({ name: 'search', required: false, description: 'Search by code or name' })
  getCitizenshipLookups(@Query() query: PaginationQueryDto & { search?: string }) {
    return this.userService.getCitizenshipLookups(query);
  }

  @Get(':id')
  @ApiGetEmployeeByIdOperation()
  findById(@Param('id') id: string) {
    return this.userService.findEmployeeById(+id);
  }

  @Patch(':id')
  @Roles('Admin')
  @ApiUpdateEmployeeOperation()
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.userService.updateEmployee(+id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteEmployeeOperation()
  async delete(@Param('id') id: string) {
    await this.userService.deleteEmployee(+id);
  }
}
