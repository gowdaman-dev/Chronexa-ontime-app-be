import { Module } from '@nestjs/common';
import { UserServiceModule } from '../user-service/user-service.module';
import { EmployeeServiceController } from './employee-service.controller';

@Module({
  imports: [UserServiceModule],
  controllers: [EmployeeServiceController],
})
export class EmployeeServiceModule {}
