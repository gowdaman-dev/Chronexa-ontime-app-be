const { MobileTransactionsService } = require('./transactions.service');

describe('MobileTransactionsService', () => {
  const fixedNow = new Date('2026-05-02T10:00:00.000Z');
  let prisma: any;
  let service: any;

  beforeEach(() => {
    prisma = {
      employee_event_transactions: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    const common = {
      assertEmployeeId: jest.fn(),
      getServerTime: jest.fn().mockResolvedValue(fixedNow),
    };
    service = new MobileTransactionsService(prisma, common);
  });

  it('returns recent transactions for an employee', async () => {
    const rows = [{ transaction_id: 2 }, { transaction_id: 1 }];
    prisma.employee_event_transactions.findMany.mockResolvedValue(rows);

    await expect(service.getLastTransactions(123)).resolves.toEqual({
      message: 'Last transactions fetched successfully',
      data: rows,
    });

    expect(prisma.employee_event_transactions.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ employee_id: 123 }),
        orderBy: { transaction_id: 'desc' },
      }),
    );
  });

  it('returns first IN and latest valid OUT for today', async () => {
    const checkIn = new Date('2026-05-02T08:00:00.000Z');
    const firstOut = new Date('2026-05-02T12:00:00.000Z');
    const lastOut = new Date('2026-05-02T17:30:00.000Z');
    prisma.employee_event_transactions.findMany.mockResolvedValue([
      { reason: 'IN', transaction_time: checkIn },
      { reason: 'OUT', transaction_time: firstOut },
      { reason: 'OUT', transaction_time: lastOut },
    ]);
    prisma.employee_event_transactions.findFirst.mockResolvedValue(null);

    await expect(service.getMyCheckInOut(123)).resolves.toEqual({
      message: "Today's check-in/check-out fetched successfully",
      data: { checkIn, checkOut: lastOut },
    });
  });
});
