import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

const { MobileTransactionsService } = require('./transactions.service');

@Controller()
export class MobileTransactionsController {
  constructor(
    @Inject(MobileTransactionsService)
    private readonly transactionsService: any,
  ) {}

  @MessagePattern('mobile_service.transactions.my_check_in_out')
  getMyCheckInOut(@Payload() data: { employeeId: number }) {
    return this.transactionsService.getMyCheckInOut(data.employeeId);
  }

  @MessagePattern('mobile_service.transactions.last_transactions')
  getLastTransactions(@Payload() data: { employeeId: number }) {
    return this.transactionsService.getLastTransactions(data.employeeId);
  }
}
