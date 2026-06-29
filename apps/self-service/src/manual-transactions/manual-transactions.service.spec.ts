const {
  ManualTransactionsService,
} = require('./manual-transactions.service');

describe('ManualTransactionsService', () => {
  let prisma: any;
  let service: any;

  beforeEach(() => {
    prisma = {
      employee_manual_transactions: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      employee_event_transactions: {
        create: jest.fn(),
      },
      emp_missing_movements: {
        update: jest.fn(),
      },
      employee_master: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };
    prisma.employee_event_transactions.createMany = jest.fn();
    const common = {
      fail: jest.fn((statusCode: number, message: string) => {
        const error: any = new Error(message);
        error.getError = () => ({ statusCode, message });
        throw error;
      }),
      toNumber: jest.fn((value: any) =>
        value === undefined || value === null || value === '' ? undefined : Number(value),
      ),
      parseDate: jest.fn((value: any) => (value ? new Date(value) : undefined)),
      parsePagination: jest.fn(() => ({ skip: 0, take: 10, limit: 10, offset: 1 })),
      dateFilter: jest.fn(),
      compact: jest.fn((value: any) =>
        Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)),
      ),
      uploadPath: jest.fn(() => '/uploads/manual-transactions/test.pdf'),
    };
    const logger = { info: jest.fn(), error: jest.fn() };
    service = new ManualTransactionsService(prisma, common, logger);
  });

  it('creates a pending manual transaction', async () => {
    prisma.employee_manual_transactions.create.mockResolvedValue({
      employee_manual_transaction_id: 10,
    });

    await expect(
      service.add({
        user: { employeeId: 123 },
        file: { originalname: 'test.pdf' },
        body: {
          employee_id: 456,
          reason: 'IN',
          remarks: 'Missed punch',
          transaction_time: '2026-06-01T08:00:00.000Z',
        },
      }),
    ).resolves.toEqual({
      message: 'Transaction created successfully',
      data: { employee_manual_transaction_id: 10 },
    });

    expect(prisma.employee_manual_transactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employee_id: 456,
          transaction_status: 'Pending',
          created_id: 123,
        }),
      }),
    );
  });

  it('approves a manual transaction and creates an event transaction', async () => {
    const transactionTime = new Date('2026-06-01T08:00:00.000Z');
    prisma.employee_manual_transactions.findUnique.mockResolvedValue({
      employee_manual_transaction_id: 10,
      employee_id: 456,
      reason: 'IN',
      transaction_time: transactionTime,
      emp_missing_movement_id: 20,
      transaction_status: 'Pending',
    });
    prisma.employee_manual_transactions.update.mockResolvedValue({
      employee_manual_transaction_id: 10,
      employee_id: 456,
      reason: 'IN',
      transaction_time: transactionTime,
      emp_missing_movement_id: 20,
    });
    prisma.employee_event_transactions.create.mockResolvedValue({
      transaction_id: 99,
      transaction_time: transactionTime,
    });
    prisma.emp_missing_movements.update.mockResolvedValue({});

    await expect(
      service.approve({
        user: { employeeId: 123 },
        query: { id: 10 },
        body: {},
      }),
    ).resolves.toEqual({
      message: 'Transaction approved successfully',
      data: {
        employee_manual_transaction_id: 10,
        employee_id: 456,
        reason: 'IN',
        transaction_time: transactionTime,
        emp_missing_movement_id: 20,
      },
    });

    expect(prisma.employee_event_transactions.create).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.emp_missing_movements.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ Status_IN: 'Approved' }),
      }),
    );
  });

  it('group approves transactions with createMany', async () => {
    prisma.employee_event_transactions.createMany.mockResolvedValue({ count: 2 });

    await expect(
      service.groupApproveTransactions({
        user: { employeeId: 123 },
        body: {
          employeeIds: [1, 2],
          transaction_time: '2026-06-01T08:00:00.000Z',
          reason: 'IN',
        },
      }),
    ).resolves.toEqual({
      message: 'Group transaction approved successfully for 2 employees.',
      numberOfEmployees: 2,
    });

    expect(prisma.employee_event_transactions.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ employee_id: 1, reason: 'IN' }),
          expect.objectContaining({ employee_id: 2, reason: 'IN' }),
        ]),
      }),
    );
  });
});
