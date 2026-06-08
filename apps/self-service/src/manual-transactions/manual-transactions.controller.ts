import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ManualTransactionsService } from './manual-transactions.service';

@Controller()
export class ManualTransactionsController {
  constructor(private readonly transactions: ManualTransactionsService) {}

  @MessagePattern('self_service.manual_transactions.add')
  add(@Payload() data: any) {
    return this.transactions.add(data);
  }

  @MessagePattern('self_service.manual_transactions.all')
  all(@Payload() data: any) {
    return this.transactions.all(data);
  }

  @MessagePattern('self_service.manual_transactions.get')
  get(@Payload() data: any) {
    return this.transactions.get(data);
  }

  @MessagePattern('self_service.manual_transactions.edit')
  edit(@Payload() data: any) {
    return this.transactions.edit(data);
  }

  @MessagePattern('self_service.manual_transactions.delete')
  delete(@Payload() data: any) {
    return this.transactions.delete(data);
  }

  @MessagePattern('self_service.manual_transactions.delete_many')
  deleteMany(@Payload() data: any) {
    return this.transactions.deleteMany(data);
  }

  @MessagePattern('self_service.manual_transactions.team_all')
  teamAll(@Payload() data: any) {
    return this.transactions.teamAll(data);
  }

  @MessagePattern('self_service.manual_transactions.approve')
  approve(@Payload() data: any) {
    return this.transactions.approve(data);
  }

  @MessagePattern('self_service.manual_transactions.reject')
  reject(@Payload() data: any) {
    return this.transactions.reject(data);
  }

  @MessagePattern('self_service.manual_transactions.group_approve')
  groupApproveTransactions(@Payload() data: any) {
    return this.transactions.groupApproveTransactions(data);
  }

  @MessagePattern('self_service.manual_transactions.group_approve_by_employee_ids')
  groupApproveByEmployeeIds(@Payload() data: any) {
    return this.transactions.groupApproveByEmployeeIds(data);
  }
}
