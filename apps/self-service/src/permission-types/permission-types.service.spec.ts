const { PermissionTypesService } = require('./permission-types.service');

describe('PermissionTypesService', () => {
  let prisma: any;
  let service: any;

  beforeEach(() => {
    prisma = {
      permission_types: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      employee_short_permissions: { count: jest.fn() },
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
    service = new PermissionTypesService(prisma, common, logger);
  });

  it('returns paginated permission types', async () => {
    prisma.permission_types.findMany.mockResolvedValue([{ permission_type_id: 1 }]);
    prisma.permission_types.count.mockResolvedValue(1);

    await expect(service.all({ query: {} })).resolves.toEqual({
      success: true,
      data: [{ permission_type_id: 1 }],
      total: 1,
      hasNext: false,
    });
  });

  it('filters permission types by gender', async () => {
    prisma.permission_types.findMany.mockResolvedValue([{ permission_type_id: 2, specific_gender: 'M' }]);
    prisma.permission_types.count.mockResolvedValue(1);

    await service.byGender({ gender: 'M' });

    expect(prisma.permission_types.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ specific_gender: 'M' }),
      }),
    );
  });
});
