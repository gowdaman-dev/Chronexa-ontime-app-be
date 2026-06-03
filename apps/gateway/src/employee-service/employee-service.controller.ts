import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserServiceService } from '../user-service/user-service.service';
import { CreateEmployeeDto, UpdateEmployeeDto, PaginationQueryDto } from '@app/dto';
import {
  ApiCreateEmployeeOperation,
  ApiGetAllEmployeesOperation,
  ApiGetEmployeeByIdOperation,
  ApiUpdateEmployeeOperation,
  ApiDeleteEmployeeOperation,
} from '@app/dto/employee.doc';
import { ApiPaginationQueryParams } from '@app/dto/pagination.doc';

@ApiTags('Employee Management')
@Controller({ path: 'employees', version: '1' })
export class EmployeeServiceController {
  constructor(private readonly userService: UserServiceService) {}

  @Post()
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

  @Get(':id')
  @ApiGetEmployeeByIdOperation()
  findById(@Param('id') id: string) {
    return this.userService.findEmployeeById(+id);
  }

  @Patch(':id')
  @ApiUpdateEmployeeOperation()
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.userService.updateEmployee(+id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteEmployeeOperation()
  async delete(@Param('id') id: string) {
    await this.userService.deleteEmployee(+id);
  }
}
