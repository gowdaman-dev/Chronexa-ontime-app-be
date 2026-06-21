import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LeaveTypesService } from './leave-types.service';

@Controller()
export class LeaveTypesController {
  constructor(private readonly leaveTypes: LeaveTypesService) {}

  @MessagePattern('self_service.leave_types.all')
  all(@Payload() data: any) {
    return this.leaveTypes.all(data);
  }

  @MessagePattern('self_service.leave_types.active')
  active() {
    return this.leaveTypes.active();
  }

  @MessagePattern('self_service.leave_types.dropdown')
  dropdown() {
    return this.leaveTypes.dropdown();
  }

  @MessagePattern('self_service.leave_types.get')
  get(@Payload() data: any) {
    return this.leaveTypes.get(data);
  }

  @MessagePattern('self_service.leave_types.add')
  add(@Payload() data: any) {
    return this.leaveTypes.add(data);
  }

  @MessagePattern('self_service.leave_types.edit')
  edit(@Payload() data: any) {
    return this.leaveTypes.edit(data);
  }

  @MessagePattern('self_service.leave_types.delete')
  delete(@Payload() data: any) {
    return this.leaveTypes.delete(data);
  }

  @MessagePattern('self_service.leave_types.delete_many')
  deleteMany(@Payload() data: any) {
    return this.leaveTypes.deleteMany(data);
  }
}
