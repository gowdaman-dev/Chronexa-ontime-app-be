import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EMPLOYEE_TYPE_KEY } from '../auth.constants';

@Injectable()
export class EmployeeTypeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredType = this.reflector.getAllAndOverride<string>(EMPLOYEE_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredType) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.employeeType !== requiredType) {
      throw new ForbiddenException(
        `Access denied. Required employee type: ${requiredType}`,
      );
    }

    return true;
  }
}
