import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService, sendRpc } from '@app/common';

@Injectable()
export class UserServiceService {
  constructor(
    @Inject('USER_SERVICE') private readonly client: ClientProxy,
    private readonly config: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  private send<T>(pattern: string, data?: any): Promise<T> {
    return sendRpc<T>(
      this.client,
      pattern,
      data ?? {},
      this.logger,
      {
        rpcTimeoutMs: this.config.get<number>('rpcTimeoutMs'),
        pattern,
      },
    );
  }

  createUser(data: any) {
    return this.send('user.create', data);
  }

  findAllUsers(limit?: number, offset?: number) {
    return this.send('user.get_all', { limit, offset });
  }

  findUserById(id: number) {
    return this.send('user.get_by_id', { id });
  }

  findUserByLogin(login: string) {
    return this.send('user.get_by_login', { login });
  }

  updateUser(id: number, data: any) {
    return this.send('user.update', { id, data });
  }

  deleteUser(id: number) {
    return this.send('user.delete', { id });
  }

  createEmployee(data: any) {
    return this.send('employee.create', data);
  }

  findAllEmployees(limit?: number, offset?: number) {
    return this.send('employee.get_all', { limit, offset });
  }

  findEmployeeById(id: number) {
    return this.send('employee.get_by_id', { id });
  }

  updateEmployee(id: number, data: any) {
    return this.send('employee.update', { id, data });
  }

  deleteEmployee(id: number) {
    return this.send('employee.delete', { id });
  }
}
