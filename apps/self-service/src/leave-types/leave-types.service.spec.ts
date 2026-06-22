const { LeaveTypesService } = require('./leave-types.service');

describe('LeaveTypesService', () => {
  let prisma: any;
  let service: any;

  beforeEach(() => {
    prisma = {
      leave_types: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      employee_leaves: { count: jest.fn() },
    };
    const common = {
      fail: jest.fn((statusCode: number, message: string) => {
        const error: any = new Error(message);
        error.getError = () => ({ statusCode, message });
        throw error;
      }),
      toBoolean: jest.fn((value: any) =>
        value === undefined || value === null || value === '' ? undefined : value === true || value === 'true',
      ),
      toNumber: jest.fn((value: any) =>
        value === undefined || value === null || value === '' ? undefined : Number(value),
      ),
      parsePagination: jest.fn(() => ({ skip: 0, take: 10, limit: 10, offset: 1 })),
      compact: jest.fn((value: any) =>
        Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)),
      ),
    };
    const logger = { info: jest.fn(), error: jest.fn() };
    service = new LeaveTypesService(prisma, common, logger);
  });

  it('returns paginated leave types with search filter', async () => {
    prisma.leave_types.findMany.mockResolvedValue([{ leave_type_id: 1 }]);
    prisma.leave_types.count.mockResolvedValue(1);

    await expect(service.all({ query: { search: 'annual' } })).resolves.toEqual({
      success: true,
      data: [{ leave_type_id: 1 }],
      total: 1,
      hasNext: false,
    });
  });

  it('creates a leave type', async () => {
    prisma.leave_types.create.mockResolvedValue({ leave_type_id: 9, leave_type_code: 'E2E' });

    await expect(
      service.add({
        user: { employeeId: 100 },
        body: { leave_type_code: 'E2E', leave_type_eng: 'E2E Leave', status_flag: true },
      }),
    ).resolves.toEqual({
      message: 'Leave type created successfully',
      data: { leave_type_id: 9, leave_type_code: 'E2E' },
    });
  });
});
