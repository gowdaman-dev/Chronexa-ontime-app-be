import { Controller, Get } from '@nestjs/common';
import { SelfServiceService } from './self-service.service';

@Controller()
export class SelfServiceController {
  constructor(private readonly selfServiceService: SelfServiceService) {}

  @Get()
  getHello(): string {
    return this.selfServiceService.getHello();
  }
}
