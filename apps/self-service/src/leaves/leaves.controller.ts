import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LeavesService } from './leaves.service';

@Controller()
export class LeavesController {
  constructor(private readonly leaves: LeavesService) {}

  @MessagePattern('self_service.leaves.add')
  add(@Payload() data: any) {
    return this.leaves.add(data);
  }

  @MessagePattern('self_service.leaves.all')
  all(@Payload() data: any) {
    return this.leaves.all(data);
  }

  @MessagePattern('self_service.leaves.pending')
  pending(@Payload() data: any) {
    return this.leaves.pending(data);
  }

  @MessagePattern('self_service.leaves.get')
  get(@Payload() data: any) {
    return this.leaves.get(data);
  }

  @MessagePattern('self_service.leaves.by_employee')
  byEmployee(@Payload() data: any) {
    return this.leaves.byEmployee(data);
  }

  @MessagePattern('self_service.leaves.approve')
  approve(@Payload() data: any) {
    return this.leaves.approve(data);
  }

  @MessagePattern('self_service.leaves.edit')
  edit(@Payload() data: any) {
    return this.leaves.edit(data);
  }

  @MessagePattern('self_service.leaves.delete')
  delete(@Payload() data: any) {
    return this.leaves.delete(data);
  }

  @MessagePattern('self_service.leaves.delete_many')
  deleteMany(@Payload() data: any) {
    return this.leaves.deleteMany(data);
  }

  @MessagePattern('self_service.leaves.my_requests')
  myRequests(@Payload() data: any) {
    return this.leaves.myRequests(data);
  }

  @MessagePattern('self_service.leaves.team_all')
  teamAll(@Payload() data: any) {
    return this.leaves.teamAll(data);
  }
}
