const { HolidaysService } = require('./holidays.service');
const { WorkflowCommonService } = require('../shared/workflow-common.service');

describe('HolidaysService', () => {
  let prisma: any;
  let service: any;
  let common: any;

  beforeEach(() => {
    prisma = {
      holidays: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
    };
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
    common = new WorkflowCommonService(logger);
    service = new HolidaysService(prisma, common, logger);
  });

  it('returns paginated holidays with year filter', async () => {
    prisma.holidays.findMany.mockResolvedValue([
      { holiday_id: 1, from_date: new Date('2025-06-01') },
    ]);
    prisma.holidays.count.mockResolvedValue(1);

    await expect(service.all({ query: { year: 2025 } })).resolves.toEqual({
      success: true,
      data: [{ holiday_id: 1, from_date: new Date('2025-06-01') }],
      total: 1,
      hasNext: false,
    });

    expect(prisma.holidays.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        where: expect.objectContaining({
          from_date: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
        }),
      }),
    );
  });

  it('applies month filter with DB pagination', async () => {
    prisma.holidays.findMany.mockResolvedValue([
      { holiday_id: 3, from_date: new Date('2025-06-15') },
    ]);
    prisma.holidays.count.mockResolvedValue(1);

    await expect(service.all({ query: { year: 2025, month: 6 } })).resolves.toEqual({
      success: true,
      data: [{ holiday_id: 3, from_date: new Date('2025-06-15') }],
      total: 1,
      hasNext: false,
    });
  });

  it('applies from_date filter on holiday from_date when used alone', async () => {
    prisma.holidays.findMany.mockResolvedValue([{ holiday_id: 1 }]);
    prisma.holidays.count.mockResolvedValue(1);

    await service.all({ query: { from_date: '2026-06-30', limit: 5, offset: 1 } });

    expect(prisma.holidays.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          from_date: common.dateFilter('2026-06-30'),
        },
      }),
    );
  });

  it('applies from_date/to_date overlap filter on /all when both are set', async () => {
    prisma.holidays.findMany.mockResolvedValue([{ holiday_id: 1 }]);
    const { startDate: from, endDate: to } = common.parseDateRange(
      '2025-06-01',
      '2025-06-30',
    );

    await service.all({ query: { from_date: '2025-06-01', to_date: '2025-06-30' } });

    expect(prisma.holidays.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ to_date: { gte: from } }, { from_date: { lte: to } }],
        },
      }),
    );
  });

  it('filters upcoming holidays by from_date/to_date with DB pagination', async () => {
    prisma.holidays.findMany.mockResolvedValue([{ holiday_id: 2 }]);
    prisma.holidays.count.mockResolvedValue(1);

    await expect(
      service.upcoming({ query: { from_date: '2025-07-01', to_date: '2025-07-31' } }),
    ).resolves.toEqual({
      success: true,
      data: [{ holiday_id: 2 }],
      total: 1,
      hasNext: false,
    });

    expect(prisma.holidays.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
      }),
    );
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
