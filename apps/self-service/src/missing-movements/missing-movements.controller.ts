import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MissingMovementsService } from './missing-movements.service';

@Controller()
export class MissingMovementsController {
  constructor(private readonly missingMovements: MissingMovementsService) {}

  @MessagePattern('self_service.missing_movements.all')
  all(@Payload() data: any) {
    return this.missingMovements.all(data);
  }

  @MessagePattern('self_service.missing_movements.team_all')
  teamAll(@Payload() data: any) {
    return this.missingMovements.teamAll(data);
  }
}
