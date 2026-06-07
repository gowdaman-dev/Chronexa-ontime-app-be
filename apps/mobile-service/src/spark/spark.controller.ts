import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

const { MobileSparkService } = require('./spark.service');

@Controller()
export class MobileSparkController {
  constructor(@Inject(MobileSparkService) private readonly sparkService: any) {}

  @MessagePattern('mobile_service.org.spark.today_location')
  getSparkTodayLocation(@Payload() data: { employeeId: number }) {
    return this.sparkService.getSparkTodayLocation(data.employeeId);
  }
}
