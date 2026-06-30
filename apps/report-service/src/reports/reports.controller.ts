import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @MessagePattern('report.daily')
  daily(@Payload() data: any) {
    return this.reports.daily(data);
  }

  @MessagePattern('report.weekly')
  weekly(@Payload() data: any) {
    return this.reports.weekly(data);
  }

  @MessagePattern('report.monthly')
  monthly(@Payload() data: any) {
    return this.reports.monthly(data);
  }

  @MessagePattern('report.attendance')
  attendance(@Payload() data: any) {
    return this.reports.attendance(data);
  }
}
