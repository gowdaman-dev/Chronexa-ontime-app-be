import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@app/auth';
import { UserServiceService } from './user-service.service';
import { CreateUserDto, UpdateUserDto, PaginationQueryDto } from '@app/dto';
import {
  ApiCreateUserOperation,
  ApiGetAllUsersOperation,
  ApiGetUserByIdOperation,
  ApiUpdateUserOperation,
  ApiDeleteUserOperation,
} from '@app/dto/user.doc';
import { ApiPaginationQueryParams } from '@app/dto/pagination.doc';

@ApiTags('User Management')
@Controller({ path: 'users', version: '1' })
export class UserServiceController {
  constructor(private readonly userService: UserServiceService) {}

  @Post()
  @Roles('Admin')
  @ApiCreateUserOperation()
  create(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Get()
  @ApiGetAllUsersOperation()
  @ApiPaginationQueryParams()
  findAll(@Query() query: PaginationQueryDto) {
    return this.userService.findAllUsers(query.limit, query.offset);
  }

  @Get(':id')
  @ApiGetUserByIdOperation()
  findById(@Param('id') id: string) {
    return this.userService.findUserById(+id);
  }

  @Patch(':id')
  @Roles('Admin')
  @ApiUpdateUserOperation()
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(+id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteUserOperation()
  async delete(@Param('id') id: string) {
    await this.userService.deleteUser(+id);
  }
}
