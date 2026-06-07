import { RpcException } from '@nestjs/microservices';

const { MobileTransactionsService } = require('./transactions.service');

describe('MobileTransactionsService', () => {
  const fixedNow = new Date('2026-05-02T10:00:00.000Z');
  let prisma: any;
  let common: any;
  let logger: any;
  let service: any;

  beforeEach(() => {
    prisma = {
      employee_event_transactions: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    common = {
      assertEmployeeId: jest.fn(),
      getServerTime: jest.fn().mockResolvedValue(fixedNow),
      fail: jest.fn((statusCode: number, message: string) => {
        throw { statusCode, message };
      }),
    };
    logger = {
      info: jest.fn(),
      error: jest.fn(),
    };
    service = new MobileTransactionsService(prisma, common, logger);
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
    expect(logger.info).toHaveBeenCalledWith(
      'Last transactions fetched successfully',
      expect.objectContaining({
        employeeId: 123,
        count: 2,
        from: expect.any(String),
        to: fixedNow.toISOString(),
      }),
    );
  });

  it('logs and throws a backend error when last transactions query fails', async () => {
    const error = new Error('database failed');
    prisma.employee_event_transactions.findMany.mockRejectedValue(error);

    await expect(service.getLastTransactions(123)).rejects.toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to fetch last transactions',
      error,
      expect.objectContaining({ employeeId: 123 }),
    );
  });

  it('preserves shared validation errors for invalid employee ids', async () => {
    common.assertEmployeeId.mockImplementationOnce(() => {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid employee ID',
      });
    });

    await expect(service.getLastTransactions(Number.NaN)).rejects.toBeInstanceOf(
      RpcException,
    );

    expect(logger.error).not.toHaveBeenCalled();
    expect(common.fail).not.toHaveBeenCalledWith(500, expect.any(String));
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
