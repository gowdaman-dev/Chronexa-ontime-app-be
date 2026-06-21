const {
  MissingMovementsService,
} = require('./missing-movements.service');

describe('MissingMovementsService', () => {
  let prisma: any;
  let service: any;

  beforeEach(() => {
    prisma = {
      emp_missing_movements: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    const common = {
      fail: jest.fn((statusCode: number, message: string) => {
        const error: any = new Error(message);
        error.getError = () => ({ statusCode, message });
        throw error;
      }),
      toNumber: jest.fn((value: any) =>
        value === undefined || value === null || value === '' ? undefined : Number(value),
      ),
      resolveEmployeeId: jest.fn((query: any) =>
        query?.employeeId !== undefined
          ? Number(query.employeeId)
          : query?.employee_id !== undefined
            ? Number(query.employee_id)
            : undefined,
      ),
      parsePagination: jest.fn(() => ({ skip: 0, take: 10, limit: 10, offset: 1 })),
      dateFilter: jest.fn(),
    };
    const logger = { error: jest.fn() };
    service = new MissingMovementsService(prisma, common, logger);
  });

  it('returns paginated missing movements', async () => {
    prisma.emp_missing_movements.findMany.mockResolvedValue([
      { emp_missing_Movements_Id: 1 },
    ]);
    prisma.emp_missing_movements.count.mockResolvedValue(1);

    await expect(service.all({ query: {} })).resolves.toEqual({
      success: true,
      data: [{ emp_missing_Movements_Id: 1 }],
      hasNext: false,
      total: 1,
    });
  });

  it('filters missing movements by employee_id alias', async () => {
    prisma.emp_missing_movements.findMany.mockResolvedValue([]);
    prisma.emp_missing_movements.count.mockResolvedValue(0);

    await service.all({ query: { employee_id: 55 } });

    expect(prisma.emp_missing_movements.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ Employee_Id: 55 }),
      }),
    );
  });

  it('filters team missing movements by manager id', async () => {
    prisma.emp_missing_movements.findMany.mockResolvedValue([]);
    prisma.emp_missing_movements.count.mockResolvedValue(0);

    await service.teamAll({ user: { employeeId: 123 }, query: {} });

    expect(prisma.emp_missing_movements.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          employee_master: expect.objectContaining({ manager_id: 123 }),
        }),
      }),
    );
  });
});
