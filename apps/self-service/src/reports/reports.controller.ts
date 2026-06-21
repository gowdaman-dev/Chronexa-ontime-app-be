import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @MessagePattern('self_service.reports.daily')
  daily(@Payload() data: any) {
    return this.reports.daily(data);
  }

  @MessagePattern('self_service.reports.weekly')
  weekly(@Payload() data: any) {
    return this.reports.weekly(data);
  }

  @MessagePattern('self_service.reports.monthly')
  monthly(@Payload() data: any) {
    return this.reports.monthly(data);
  }

  @MessagePattern('self_service.reports.attendance')
  attendance(@Payload() data: any) {
    return this.reports.attendance(data);
  }
}
