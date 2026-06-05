import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SelfServiceService } from './self-service.service';

@Controller()
export class SelfServiceController {
  constructor(private readonly selfServiceService: SelfServiceService) {}

  @MessagePattern('self_service.mobile.transactions.my_check_in_out')
  getMyCheckInOut(@Payload() data: { employeeId: number }) {
    return this.selfServiceService.getMyCheckInOut(data.employeeId);
  }

  @MessagePattern('self_service.mobile.location.my_work_location')
  getMyWorkLocation(@Payload() data: { employeeId: number }) {
    return this.selfServiceService.getMyWorkLocation(data.employeeId);
  }

  @MessagePattern('self_service.mobile.transactions.last_transactions')
  getLastTransactions(@Payload() data: { employeeId: number }) {
    return this.selfServiceService.getLastTransactions(data.employeeId);
  }

  @MessagePattern('self_service.mobile.location.verify_assigned_location')
  verifyAssignedLocation(
    @Payload() data: { employeeId: number; coordinates: [number, number] },
  ) {
    return this.selfServiceService.verifyAssignedLocation(
      data.employeeId,
      data.coordinates,
    );
  }

  @MessagePattern('self_service.mobile.location.verify_location')
  verifyLocation(@Payload() data: { coordinates: [number, number] }) {
    return this.selfServiceService.verifyLocation(data.coordinates);
  }

  @MessagePattern('self_service.org.spark.today_location')
  getSparkTodayLocation(@Payload() data: { employeeId: number }) {
    return this.selfServiceService.getSparkTodayLocation(data.employeeId);
  }

  @MessagePattern('self_service.ids.punch')
  punch(@Payload() data: any) {
    return this.selfServiceService.punch(data);
  }

  @MessagePattern('self_service.ids.verify_encounter')
  verifyEncounter(@Payload() data: any) {
    return this.selfServiceService.verifyEncounter(data);
  }
}
