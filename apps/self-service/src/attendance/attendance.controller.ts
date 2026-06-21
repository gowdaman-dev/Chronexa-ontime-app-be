import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AttendanceService } from './attendance.service';

@Controller()
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @MessagePattern('self_service.attendance.daily')
  daily(@Payload() data: any) {
    return this.attendance.daily(data);
  }
}
