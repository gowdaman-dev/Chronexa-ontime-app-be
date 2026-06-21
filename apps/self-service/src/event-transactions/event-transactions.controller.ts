import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventTransactionsService } from './event-transactions.service';

@Controller()
export class EventTransactionsController {
  constructor(private readonly transactions: EventTransactionsService) {}

  @MessagePattern('self_service.event_transactions.add')
  add(@Payload() data: any) {
    return this.transactions.add(data);
  }

  @MessagePattern('self_service.event_transactions.add_with_subject_id')
  addWithSubjectId(@Payload() data: any) {
    return this.transactions.addWithSubjectId(data);
  }

  @MessagePattern('self_service.event_transactions.verify')
  verify(@Payload() data: any) {
    return this.transactions.verify(data);
  }

  @MessagePattern('self_service.event_transactions.all')
  all(@Payload() data: any) {
    return this.transactions.all(data);
  }

  @MessagePattern('self_service.event_transactions.get')
  get(@Payload() data: any) {
    return this.transactions.get(data);
  }

  @MessagePattern('self_service.event_transactions.by_employee')
  byEmployee(@Payload() data: any) {
    return this.transactions.byEmployee(data);
  }

  @MessagePattern('self_service.event_transactions.team_all')
  teamAll(@Payload() data: any) {
    return this.transactions.teamAll(data);
  }

  @MessagePattern('self_service.event_transactions.edit')
  edit(@Payload() data: any) {
    return this.transactions.edit(data);
  }

  @MessagePattern('self_service.event_transactions.delete')
  delete(@Payload() data: any) {
    return this.transactions.delete(data);
  }

  @MessagePattern('self_service.event_transactions.delete_many')
  deleteMany(@Payload() data: any) {
    return this.transactions.deleteMany(data);
  }

  @MessagePattern('self_service.event_transactions.my_last')
  myLastTransactions(@Payload() data: any) {
    return this.transactions.myLastTransactions(data);
  }

  @MessagePattern('self_service.event_transactions.last')
  lastTransaction(@Payload() data: any) {
    return this.transactions.lastTransaction(data);
  }

  @MessagePattern('self_service.event_transactions.punch_status')
  punchStatus(@Payload() data: any) {
    return this.transactions.punchStatus(data);
  }

  @MessagePattern('self_service.event_transactions.today_status')
  todayStatus(@Payload() data: any) {
    return this.transactions.todayStatus(data);
  }
}
