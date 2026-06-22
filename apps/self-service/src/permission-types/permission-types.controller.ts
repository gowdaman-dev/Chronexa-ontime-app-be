import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionTypesService } from './permission-types.service';

@Controller()
export class PermissionTypesController {
  constructor(private readonly permissionTypes: PermissionTypesService) {}

  @MessagePattern('self_service.permission_types.all')
  all(@Payload() data: any) {
    return this.permissionTypes.all(data);
  }

  @MessagePattern('self_service.permission_types.active')
  active() {
    return this.permissionTypes.active();
  }

  @MessagePattern('self_service.permission_types.by_gender')
  byGender(@Payload() data: any) {
    return this.permissionTypes.byGender(data);
  }

  @MessagePattern('self_service.permission_types.get')
  get(@Payload() data: any) {
    return this.permissionTypes.get(data);
  }

  @MessagePattern('self_service.permission_types.add')
  add(@Payload() data: any) {
    return this.permissionTypes.add(data);
  }

  @MessagePattern('self_service.permission_types.edit')
  edit(@Payload() data: any) {
    return this.permissionTypes.edit(data);
  }

  @MessagePattern('self_service.permission_types.delete')
  delete(@Payload() data: any) {
    return this.permissionTypes.delete(data);
  }

  @MessagePattern('self_service.permission_types.delete_many')
  deleteMany(@Payload() data: any) {
    return this.permissionTypes.deleteMany(data);
  }

  @MessagePattern('self_service.permission_types.search')
  search(@Payload() data: any) {
    return this.permissionTypes.search(data);
  }
}
