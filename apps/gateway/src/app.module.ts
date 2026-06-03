import { Module } from '@nestjs/common';
import { AuditInterceptor, AuditModule } from '@app/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '@app/auth';
import { UserServiceModule } from './user-service/user-service.module';
import { EmployeeServiceModule } from './employee-service/employee-service.module';
import { AuthServiceModule } from './auth-service/auth-service.module';
import { AuthServiceService } from './auth-service/auth-service.service';

@Module({
  imports: [
    AuditModule,
    AuthModule.forRoot(AuthServiceService),
    AuthServiceModule,
    UserServiceModule,
    EmployeeServiceModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
