import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SelfServiceService } from './self-service.service';

@Controller()
export class SelfServiceController {
  constructor(private readonly selfServiceService: SelfServiceService) {}

  @MessagePattern('self_service.ids.punch')
  punch(@Payload() data: any) {
    return this.selfServiceService.punch(data);
  }
}
