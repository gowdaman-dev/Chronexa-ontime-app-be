const { HolidaysService } = require('./holidays.service');

describe('HolidaysService', () => {
  let prisma: any;
  let service: any;

  beforeEach(() => {
    prisma = {
      holidays: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
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
      parseDate: jest.fn((value: any) => (value ? new Date(value) : undefined)),
      parseDateRange: jest.fn((start?: string, end?: string) => ({
        startDate: start ? new Date(start) : undefined,
        endDate: end ? new Date(end) : undefined,
      })),
      dateFilter: jest.fn((start?: string, end?: string) => {
        if (!start && !end) return undefined;
        const filter: any = {};
        if (start) filter.gte = new Date(start);
        if (end) filter.lte = new Date(end);
        return filter;
      }),
      mergeWhere: jest.fn((base: any, extra: any) => ({ ...base, ...extra })),
      compact: jest.fn((value: any) =>
        Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)),
      ),
    };
    const logger = { info: jest.fn(), error: jest.fn() };
    service = new HolidaysService(prisma, common, logger);
  });

  it('returns paginated holidays with year filter', async () => {
    prisma.holidays.findMany.mockResolvedValue([
      { holiday_id: 1, from_date: new Date('2025-06-01') },
      { holiday_id: 2, from_date: new Date('2024-06-01') },
    ]);

    await expect(service.all({ query: { year: 2025 } })).resolves.toEqual({
      success: true,
      data: [{ holiday_id: 1, from_date: new Date('2025-06-01') }],
      total: 1,
      hasNext: false,
    });
  });

  it('applies from_date/to_date overlap filter on /all', async () => {
    prisma.holidays.findMany.mockResolvedValue([{ holiday_id: 1 }]);

    await service.all({ query: { from_date: '2025-06-01', to_date: '2025-06-30' } });

    expect(prisma.holidays.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.any(Array),
        }),
      }),
    );
  });

  it('filters upcoming holidays by from_date/to_date', async () => {
    prisma.holidays.findMany.mockResolvedValue([{ holiday_id: 2 }]);

    await expect(
      service.upcoming({ query: { from_date: '2025-07-01', to_date: '2025-07-31' } }),
    ).resolves.toEqual({
      success: true,
      data: [{ holiday_id: 2 }],
      total: 1,
      hasNext: false,
    });
  });

  it('creates a holiday', async () => {
    prisma.holidays.create.mockResolvedValue({ holiday_id: 3, holiday_eng: 'E2E Holiday' });

    await expect(
      service.add({
        user: { employeeId: 100 },
        body: {
          holiday_eng: 'E2E Holiday',
          from_date: '2099-01-01',
          to_date: '2099-01-01',
        },
      }),
    ).resolves.toEqual({
      message: 'Holiday created successfully',
      data: { holiday_id: 3, holiday_eng: 'E2E Holiday' },
    });
  });
});
