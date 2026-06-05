import { Module } from '@nestjs/common';
import { AuditInterceptor, AuditModule } from '@app/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '@app/auth';
import { ConfigModule } from '@app/config';
import { UserServiceModule } from './user-service/user-service.module';
import { EmployeeServiceModule } from './employee-service/employee-service.module';
import { AuthServiceModule } from './auth-service/auth-service.module';
import { AuthServiceService } from './auth-service/auth-service.service';
import { SelfServiceModule } from './self-service/self-service.module';

@Module({
  imports: [
    ConfigModule,
    AuditModule,
    AuthServiceModule,
    AuthModule.forRoot(AuthServiceService, [AuthServiceModule]),
    UserServiceModule,
    EmployeeServiceModule,
    SelfServiceModule,
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
