const { EventTransactionsService } = require('./event-transactions.service');

describe('EventTransactionsService', () => {
  let prisma: any;
  let service: any;

  beforeEach(() => {
    prisma = {
      employee_event_transactions: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      employee_master: { findFirst: jest.fn() },
      holidays: { findMany: jest.fn() },
      $queryRawUnsafe: jest.fn(),
    };
    const common = {
      fail: jest.fn((statusCode: number, message: string) => {
        const error: any = new Error(message);
        error.getError = () => ({ statusCode, message });
        throw error;
      }),
      toBoolean: jest.fn((value: any) =>
        value === undefined || value === null || value === ''
          ? undefined
          : value === true || value === 'true',
      ),
      toNumber: jest.fn((value: any) =>
        value === undefined || value === null || value === '' ? undefined : Number(value),
      ),
      parseDate: jest.fn((value: any) => (value ? new Date(value) : undefined)),
      parsePagination: jest.fn(() => ({ skip: 0, take: 10, limit: 10, offset: 1 })),
      dateFilter: jest.fn(() => ({ gte: new Date('2025-01-01'), lte: new Date('2025-12-31') })),
      resolveEmployeeId: jest.fn((query: any) => query?.employee_id ?? query?.employeeId),
      compact: jest.fn((value: any) =>
        Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)),
      ),
    };
    const logger = { info: jest.fn(), error: jest.fn() };
    service = new EventTransactionsService(prisma, common, logger);
  });

  it('returns paginated event transactions', async () => {
    prisma.employee_event_transactions.findMany.mockResolvedValue([{ transaction_id: 1 }]);
    prisma.employee_event_transactions.count.mockResolvedValue(1);

    await expect(
      service.all({ query: { from_date: '2025-01-01', to_date: '2025-12-31' } }),
    ).resolves.toEqual({
      success: true,
      data: [{ transaction_id: 1 }],
      total: 1,
      hasNext: false,
    });
  });

  it('creates an event transaction', async () => {
    prisma.employee_event_transactions.create.mockResolvedValue({
      transaction_id: 99,
      reason: 'IN',
    });

    await expect(
      service.add({
        user: { employeeId: 100 },
        body: {
          employee_id: 100,
          reason: 'IN',
          transaction_time: '2026-06-10T08:00:00',
        },
      }),
    ).resolves.toEqual({
      message: 'Employee event transaction created successfully',
      data: { transaction_id: 99, reason: 'IN' },
    });
  });
});
