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
      dateFilter: jest.fn(() => undefined),
      compact: jest.fn((value: any) =>
        Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)),
      ),
    };
    const logger = { info: jest.fn(), error: jest.fn() };
    service = new HolidaysService(prisma, common, logger);
  });

  it('returns paginated holidays with year filter', async () => {
    prisma.holidays.findMany.mockResolvedValue([{ holiday_id: 1 }]);
    prisma.holidays.count.mockResolvedValue(1);

    await expect(service.all({ query: { year: 2025 } })).resolves.toEqual({
      success: true,
      data: [{ holiday_id: 1 }],
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
