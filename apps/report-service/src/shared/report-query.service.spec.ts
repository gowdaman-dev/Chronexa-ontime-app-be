const { ReportQueryService } = require('./report-query.service');

describe('ReportQueryService pagination', () => {
  const common = {
    parseReportPagination: jest.fn(),
    parseNumberArray: jest.fn(() => []),
    resolveEmployeeId: jest.fn(),
    toNumber: jest.fn((v) => (v == null || v === '' ? undefined : Number(v))),
  };
  const prisma = { $queryRawUnsafe: jest.fn() };
  let service: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ EmployeeID: 1 }])
      .mockResolvedValueOnce([{ cnt: 1 }]);
    service = new ReportQueryService(prisma, common);
  });

  it('omits OFFSET/FETCH when pagination is unlimited', async () => {
    common.parseReportPagination.mockReturnValue({
      unlimited: true,
      offset: 1,
      skip: 0,
      take: 0,
    });

    await service.querySpEmployeeDailyReport({ date: '2025-06-01' });

    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).not.toContain('OFFSET');
    expect(sql).not.toContain('FETCH NEXT');
  });

  it('applies OFFSET/FETCH when limit is set', async () => {
    common.parseReportPagination.mockReturnValue({
      unlimited: false,
      offset: 2,
      skip: 10,
      take: 10,
    });

    await service.querySpEmployeeDailyReport({ date: '2025-06-01', limit: 10, offset: 2 });

    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('OFFSET 10 ROWS FETCH NEXT 10 ROWS ONLY');
  });

  it('omits OFFSET/FETCH when unlimited=true is sent', async () => {
    common.parseReportPagination.mockReturnValue({
      unlimited: true,
      offset: 1,
      skip: 0,
      take: 0,
    });

    await service.querySpEmployeeDailyReport({
      from_date: '2026-06-22',
      to_date: '2026-06-28',
      unlimited: 'true',
    });

    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain("WorkDate >= '2026-06-22'");
    expect(sql).toContain("WorkDate <= '2026-06-28'");
    expect(sql).not.toContain('OFFSET');
  });
});

describe('ReportQueryService date filters (old /report/attendance behaviour)', () => {
  const common = {
    parseReportPagination: jest.fn(() => ({
      unlimited: true,
      offset: 1,
      skip: 0,
      take: 0,
    })),
    parseNumberArray: jest.fn(() => []),
    resolveEmployeeId: jest.fn(),
    toNumber: jest.fn((v) => (v == null || v === '' ? undefined : Number(v))),
  };
  const prisma = { $queryRawUnsafe: jest.fn() };
  let service: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$queryRawUnsafe
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ cnt: 0 }]);
    service = new ReportQueryService(prisma, common);
  });

  it('does not add WorkDate filters when no date params are sent', async () => {
    await service.querySpEmployeeDailyReport({});

    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).not.toContain('WorkDate >=');
    expect(sql).not.toContain('WorkDate <=');
    expect(sql).not.toMatch(/WorkDate =/);
  });

  it('applies from_date and to_date independently', async () => {
    await service.querySpEmployeeDailyReport({
      from_date: '2026-06-01',
      to_date: '2026-06-30',
    });

    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain("WorkDate >= '2026-06-01'");
    expect(sql).toContain("WorkDate <= '2026-06-30'");
  });

  it('applies only from_date when to_date is omitted', async () => {
    await service.querySpEmployeeDailyReport({ from_date: '2026-06-01' });

    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain("WorkDate >= '2026-06-01'");
    expect(sql).not.toContain('WorkDate <=');
  });

  it('resolveDateRange returns empty object when no date filters are sent', () => {
    expect(service.resolveDateRange('daily', {})).toEqual({});
    expect(service.resolveDateRange('weekly', {})).toEqual({});
    expect(service.resolveDateRange('monthly', {})).toEqual({});
  });

  it('resolveDateRange keeps independent from_date/to_date without period math', () => {
    expect(
      service.resolveDateRange('weekly', {
        from_date: '2026-06-01',
        to_date: '2026-06-30',
      }),
    ).toEqual({
      from_date: '2026-06-01',
      to_date: '2026-06-30',
    });
  });

  it('resolveDateRange expands weekly range only when date anchor is provided', () => {
    expect(service.resolveDateRange('weekly', { date: '2026-06-23' })).toEqual({
      from_date: '2026-06-17',
      to_date: '2026-06-23',
    });
  });
});
