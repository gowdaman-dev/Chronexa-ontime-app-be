import { Module, DynamicModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { RbacGuard } from './guards/rbac.guard';
import { EmployeeTypeGuard } from './guards/employee-type.guard';
import { AUTH_VALIDATOR } from './auth.constants';

@Module({})
export class AuthModule {
  static forRoot(validatorToken: any): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        {
          provide: AUTH_VALIDATOR,
          useExisting: validatorToken,
        },
        AuthGuard,
        RbacGuard,
        EmployeeTypeGuard,
        { provide: APP_GUARD, useClass: AuthGuard },
        { provide: APP_GUARD, useClass: RbacGuard },
        { provide: APP_GUARD, useClass: EmployeeTypeGuard },
      ],
      exports: [AuthGuard, RbacGuard, EmployeeTypeGuard],
    };
  }
}
