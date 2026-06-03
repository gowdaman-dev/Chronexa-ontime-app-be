import { Module, DynamicModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { RbacGuard } from './guards/rbac.guard';
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
        { provide: APP_GUARD, useClass: AuthGuard },
        { provide: APP_GUARD, useClass: RbacGuard },
      ],
      exports: [AuthGuard, RbacGuard],
    };
  }
}
