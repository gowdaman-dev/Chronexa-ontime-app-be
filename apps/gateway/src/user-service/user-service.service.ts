import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError } from 'rxjs';

@Injectable()
export class UserServiceService {
  constructor(@Inject('USER_SERVICE') private readonly client: ClientProxy) {}

  private async send<T>(pattern: any, data?: any): Promise<T> {
    return firstValueFrom(
      this.client.send<T>(pattern, data ?? {}).pipe(
        catchError((err: any) => {
          if (err?.statusCode) {
            return throwError(() => new HttpException(err.message, err.statusCode));
          }
          return throwError(() => new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE));
        }),
      ),
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
