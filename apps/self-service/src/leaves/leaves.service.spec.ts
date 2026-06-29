const { LeavesService } = require('./leaves.service');

describe('LeavesService', () => {
  let prisma: any;
  let service: any;

  beforeEach(() => {
    prisma = {
      employee_leaves: {
        findFirst: jest.fn(),
        create: jest.fn(),
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
      toBoolean: jest.fn((value: any) =>
        value === undefined || value === null || value === ''
          ? undefined
          : value === true || value === 'true' || value === '1',
      ),
      parseDate: jest.fn((value: any) => (value ? new Date(value) : undefined)),
      parsePagination: jest.fn(() => ({ skip: 0, take: 10, limit: 10, offset: 1 })),
      dateFilter: jest.fn(),
      mergeWhere: jest.fn((base: any, extra: any) => ({ ...base, ...extra })),
      resolveEmployeeId: jest.fn((query: any) =>
        query?.employeeId !== undefined
          ? Number(query.employeeId)
          : query?.employee_id !== undefined
            ? Number(query.employee_id)
            : undefined,
      ),
      buildLeaveAllDateFilter: jest.fn(() => ({})),
      buildLeaveTeamDateFilter: jest.fn(() => ({})),
      buildLeaveEmployeeGetDateFilter: jest.fn(() => ({})),
      applyEmployeeOrgScope: jest.fn((where: any) => where),
      isAdminRole: jest.fn(() => false),
      compact: jest.fn((value: any) =>
        Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)),
      ),
      uploadPath: jest.fn(),
    };
    const logger = { info: jest.fn(), error: jest.fn() };
    service = new LeavesService(prisma, common, logger);
  });

  it('creates a leave request for the authenticated employee', async () => {
    prisma.employee_leaves.findFirst.mockResolvedValue(null);
    prisma.employee_leaves.create.mockResolvedValue({ employee_leave_id: 10 });

    await expect(
      service.add({
        user: { employeeId: 123 },
        body: {
          leave_type_id: 1,
          from_date: '2026-06-01',
          to_date: '2026-06-02',
        },
      }),
    ).resolves.toEqual({
      message: 'Employee leave application submitted successfully',
      data: { employee_leave_id: 10 },
    });

    expect(prisma.employee_leaves.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employee_id: 123,
          leave_type_id: 1,
          leave_status: 'PENDING',
        }),
      }),
    );
  });

  it('returns paginated leave requests with employee_master alias', async () => {
    prisma.employee_leaves.findMany.mockResolvedValue([
      {
        employee_leave_id: 1,
        employee_master_employee_leaves_employee_idToemployee_master: {
          emp_no: 'E001',
        },
      },
    ]);
    prisma.employee_leaves.count.mockResolvedValue(1);

    await expect(service.all({ query: {} })).resolves.toEqual({
      success: true,
      data: [{ employee_leave_id: 1, employee_master: { emp_no: 'E001' } }],
      total: 1,
      hasNext: false,
    });
  });
});
