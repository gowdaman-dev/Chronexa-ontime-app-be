import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

const { MobileIdsService } = require('./ids.service');

@Controller()
export class MobileIdsController {
  constructor(@Inject(MobileIdsService) private readonly idsService: any) {}

  @MessagePattern('mobile_service.ids.verify_encounter')
  verifyEncounter(@Payload() data: any) {
    return this.idsService.verifyEncounter(data);
  }
}
