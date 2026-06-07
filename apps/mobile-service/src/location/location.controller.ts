import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

const { MobileLocationService } = require('./location.service');

@Controller()
export class MobileLocationController {
  constructor(
    @Inject(MobileLocationService) private readonly locationService: any,
  ) {}

  @MessagePattern('mobile_service.location.my_work_location')
  getMyWorkLocation(@Payload() data: { employeeId: number }) {
    return this.locationService.getMyWorkLocation(data.employeeId);
  }

  @MessagePattern('mobile_service.location.verify_assigned_location')
  verifyAssignedLocation(
    @Payload() data: { employeeId: number; coordinates: [number, number] },
  ) {
    return this.locationService.verifyAssignedLocation(
      data.employeeId,
      data.coordinates,
    );
  }

  @MessagePattern('mobile_service.location.verify_location')
  verifyLocation(@Payload() data: { coordinates: [number, number] }) {
    return this.locationService.verifyLocation(data.coordinates);
  }
}
