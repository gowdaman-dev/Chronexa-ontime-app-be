import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ShortPermissionsService } from './short-permissions.service';

@Controller()
export class ShortPermissionsController {
  constructor(private readonly permissions: ShortPermissionsService) {}

  @MessagePattern('self_service.short_permissions.add')
  add(@Payload() data: any) {
    return this.permissions.add(data);
  }

  @MessagePattern('self_service.short_permissions.all')
  all(@Payload() data: any) {
    return this.permissions.all(data);
  }

  @MessagePattern('self_service.short_permissions.pending')
  pending(@Payload() data: any) {
    return this.permissions.pending(data);
  }

  @MessagePattern('self_service.short_permissions.get')
  get(@Payload() data: any) {
    return this.permissions.get(data);
  }

  @MessagePattern('self_service.short_permissions.by_employee')
  byEmployee(@Payload() data: any) {
    return this.permissions.byEmployee(data);
  }

  @MessagePattern('self_service.short_permissions.approve')
  approve(@Payload() data: any) {
    return this.permissions.approve(data);
  }

  @MessagePattern('self_service.short_permissions.edit')
  edit(@Payload() data: any) {
    return this.permissions.edit(data);
  }

  @MessagePattern('self_service.short_permissions.delete')
  delete(@Payload() data: any) {
    return this.permissions.delete(data);
  }

  @MessagePattern('self_service.short_permissions.search')
  search(@Payload() data: any) {
    return this.permissions.search(data);
  }

  @MessagePattern('self_service.short_permissions.delete_many')
  deleteMany(@Payload() data: any) {
    return this.permissions.deleteMany(data);
  }

  @MessagePattern('self_service.short_permissions.team_all')
  teamAll(@Payload() data: any) {
    return this.permissions.teamAll(data);
  }
}
