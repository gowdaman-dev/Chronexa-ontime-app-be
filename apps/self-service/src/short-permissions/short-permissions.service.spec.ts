const {
  ShortPermissionsService,
} = require('./short-permissions.service');

describe('ShortPermissionsService', () => {
  let prisma: any;
  let service: any;

  beforeEach(() => {
    prisma = {
      employee_short_permissions: {
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
      resolveEmployeeId: jest.fn((query: any) =>
        query?.employeeId !== undefined
          ? Number(query.employeeId)
          : query?.employee_id !== undefined
            ? Number(query.employee_id)
            : undefined,
      ),
      parseDate: jest.fn((value: any) => (value ? new Date(value) : undefined)),
      parsePagination: jest.fn(() => ({ skip: 0, take: 10, limit: 10, offset: 1 })),
      dateFilter: jest.fn(() => undefined),
      mergeWhere: jest.fn((base: any, extra: any) => ({ ...base, ...extra })),
      applyEmployeeOrgScope: jest.fn((where: any) => where),
      compact: jest.fn((value: any) =>
        Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)),
      ),
    };
    const logger = { info: jest.fn(), error: jest.fn() };
    service = new ShortPermissionsService(prisma, common, logger);
  });

  it('creates a short permission for the authenticated employee', async () => {
    prisma.employee_short_permissions.findFirst.mockResolvedValue(null);
    prisma.employee_short_permissions.create.mockResolvedValue({
      short_permission_id: 5,
    });

    await expect(
      service.add({
        user: { employeeId: 123 },
        body: {
          permission_type_id: 1,
          from_date: '2026-06-01',
          to_date: '2026-06-01',
          from_time: '09:00',
          to_time: '10:00',
          remarks: 'Medical appointment',
        },
      }),
    ).resolves.toEqual({
      message: 'Employee short permission application submitted successfully',
      data: { short_permission_id: 5 },
    });

    expect(prisma.employee_short_permissions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employee_id: 123,
          permission_type_id: 1,
          approve_reject_flag: 0,
        }),
      }),
    );
  });

  it('returns paginated short permission requests', async () => {
    prisma.employee_short_permissions.findMany.mockResolvedValue([
      {
        short_permission_id: 1,
        employee_master_employee_short_permissions_employee_idToemployee_master: {
          emp_no: 'E001',
        },
      },
    ]);
    prisma.employee_short_permissions.count.mockResolvedValue(1);

    await expect(service.all({ query: {} })).resolves.toEqual({
      success: true,
      data: [{ short_permission_id: 1, employee_master: { emp_no: 'E001' } }],
      total: 1,
      hasNext: false,
    });
  });

  it('scopes team/all by manager with pending and employeeId filters', async () => {
    prisma.employee_short_permissions.findMany.mockResolvedValue([]);
    prisma.employee_short_permissions.count.mockResolvedValue(0);

    await service.teamAll({
      user: { employeeId: 77001 },
      query: { pending: 'true', employeeId: 78237, from_date: '2026-05-01' },
    });

    expect(prisma.employee_short_permissions.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          employee_id: 78237,
          approve_reject_flag: 0,
        }),
      }),
    );
  });
});
