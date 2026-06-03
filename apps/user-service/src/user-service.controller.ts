import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserServiceService } from './user-service.service';

@Controller()
export class UserServiceController {
  constructor(private readonly userServiceService: UserServiceService) {}

  @MessagePattern('user.get_by_id')
  getById(@Payload() data: { id: number }) {
    return this.userServiceService.getUserById(data.id);
  }

  @MessagePattern('user.get_by_login')
  getByLogin(@Payload() data: { login: string }) {
    return this.userServiceService.getUserByLogin(data.login);
  }

  @MessagePattern('user.get_all')
  getAll(@Payload() data: { limit?: number; offset?: number }) {
    return this.userServiceService.getAllUsers(data.limit, data.offset);
  }

  @MessagePattern('user.create')
  create(@Payload() data: any) {
    return this.userServiceService.createUser(data);
  }

  @MessagePattern('user.update')
  update(@Payload() data: { id: number; data: any }) {
    return this.userServiceService.updateUser(data.id, data.data);
  }

  @MessagePattern('user.delete')
  delete(@Payload() data: { id: number }) {
    return this.userServiceService.deleteUser(data.id);
  }

  @MessagePattern('employee.get_by_id')
  getEmployeeById(@Payload() data: { id: number }) {
    return this.userServiceService.getEmployeeById(data.id);
  }

  @MessagePattern('employee.get_all')
  getAllEmployees(@Payload() data: { limit?: number; offset?: number }) {
    return this.userServiceService.getAllEmployees(data.limit, data.offset);
  }

  @MessagePattern('employee.create')
  createEmployee(@Payload() data: any) {
    return this.userServiceService.createEmployee(data);
  }

  @MessagePattern('employee.update')
  updateEmployee(@Payload() data: { id: number; data: any }) {
    return this.userServiceService.updateEmployee(data.id, data.data);
  }

  @MessagePattern('employee.delete')
  deleteEmployee(@Payload() data: { id: number }) {
    return this.userServiceService.deleteEmployee(data.id);
  }
}
