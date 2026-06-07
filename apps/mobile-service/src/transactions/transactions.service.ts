import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

const { MobileCommonService } = require('../shared/mobile-common.service');

@Injectable()
export class MobileTransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MobileCommonService) private readonly common: any,
  ) {}

  async getLastTransactions(employeeId: number) {
    this.common.assertEmployeeId(employeeId);
    const currentDate = await this.common.getServerTime();
    const lastDaysAgo = new Date(currentDate);
    lastDaysAgo.setDate(lastDaysAgo.getDate() - 4);

    const transactions = await this.prisma.employee_event_transactions.findMany(
      {
        where: {
          employee_id: employeeId,
          transaction_time: {
            gte: lastDaysAgo,
            lte: currentDate,
          },
        },
        orderBy: { transaction_id: 'desc' },
      },
    );

    return {
      message: 'Last transactions fetched successfully',
      data: transactions,
    };
  }

  async getMyCheckInOut(employeeId: number) {
    this.common.assertEmployeeId(employeeId);
    const currentDate = await this.common.getServerTime();
    const year = currentDate.getUTCFullYear();
    const month = currentDate.getUTCMonth();
    const day = currentDate.getUTCDate();
    const todayStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    const yesterdayStart = new Date(Date.UTC(year, month, day - 1, 0, 0, 0, 0));
    const yesterdayEnd = new Date(
      Date.UTC(year, month, day - 1, 23, 59, 59, 999),
    );

    const [todayTransactions, yesterdayLastCheckIn] = await Promise.all([
      this.prisma.employee_event_transactions.findMany({
        where: {
          employee_id: employeeId,
          transaction_time: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        orderBy: { transaction_time: 'asc' },
      }),
      this.prisma.employee_event_transactions.findFirst({
        where: {
          employee_id: employeeId,
          reason: 'IN',
          transaction_time: {
            gte: yesterdayStart,
            lte: yesterdayEnd,
          },
        },
        orderBy: { transaction_time: 'desc' },
      }),
    ]);

    let checkIn: Date | null = null;
    let checkOut: Date | null = null;
    const todayCheckIns = todayTransactions.filter(
      (transaction) => transaction.reason === 'IN',
    );
    const todayCheckOuts = todayTransactions.filter(
      (transaction) => transaction.reason === 'OUT',
    );

    if (todayCheckIns.length > 0) {
      checkIn = todayCheckIns[0].transaction_time;
      const validCheckOuts = todayCheckOuts.filter(
        (transaction) =>
          transaction.transaction_time.getTime() > checkIn!.getTime(),
      );
      checkOut = validCheckOuts.length
        ? validCheckOuts[validCheckOuts.length - 1].transaction_time
        : null;
    } else if (todayCheckOuts.length > 0 && yesterdayLastCheckIn) {
      const lastCheckOut = todayCheckOuts[todayCheckOuts.length - 1];
      const diffHours =
        (lastCheckOut.transaction_time.getTime() -
          yesterdayLastCheckIn.transaction_time.getTime()) /
        (1000 * 60 * 60);
      if (diffHours > 0 && diffHours <= 16) {
        checkIn = yesterdayLastCheckIn.transaction_time;
        checkOut = lastCheckOut.transaction_time;
      }
    }

    return {
      message: "Today's check-in/check-out fetched successfully",
      data: { checkIn, checkOut },
    };
  }
}
