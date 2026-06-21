import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { HolidaysService } from './holidays.service';

@Controller()
export class HolidaysController {
  constructor(private readonly holidays: HolidaysService) {}

  @MessagePattern('self_service.holidays.all')
  all(@Payload() data: any) {
    return this.holidays.all(data);
  }

  @MessagePattern('self_service.holidays.get')
  get(@Payload() data: any) {
    return this.holidays.get(data);
  }

  @MessagePattern('self_service.holidays.upcoming')
  upcoming(@Payload() data: any) {
    return this.holidays.upcoming(data);
  }

  @MessagePattern('self_service.holidays.search')
  search(@Payload() data: any) {
    return this.holidays.search(data);
  }

  @MessagePattern('self_service.holidays.add')
  add(@Payload() data: any) {
    return this.holidays.add(data);
  }

  @MessagePattern('self_service.holidays.edit')
  edit(@Payload() data: any) {
    return this.holidays.edit(data);
  }

  @MessagePattern('self_service.holidays.delete')
  delete(@Payload() data: any) {
    return this.holidays.delete(data);
  }

  @MessagePattern('self_service.holidays.delete_many')
  deleteMany(@Payload() data: any) {
    return this.holidays.deleteMany(data);
  }
}
