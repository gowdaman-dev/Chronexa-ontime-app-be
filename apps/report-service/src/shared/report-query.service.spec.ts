const { ReportQueryService } = require('./report-query.service');

describe('ReportQueryService pagination', () => {
  const common = {
    parseReportPagination: jest.fn(),
    parseNumberArray: jest.fn(() => []),
    resolveEmployeeId: jest.fn(),
    toNumber: jest.fn((v) => (v == null || v === '' ? undefined : Number(v))),
  };
  const prisma = { $queryRaw: jest.fn() };
  let service: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$queryRaw
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

    expect(prisma.$queryRaw).toHaveBeenCalled();
    const sqlArg = prisma.$queryRaw.mock.calls[0][0];
    const sql = Array.isArray(sqlArg?.strings)
      ? sqlArg.strings.join('')
      : String(sqlArg);
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

    const sqlArg = prisma.$queryRaw.mock.calls[0][0];
    const sql = Array.isArray(sqlArg?.strings)
      ? sqlArg.strings.join('')
      : String(sqlArg);
    expect(sql).toContain('OFFSET');
    expect(sql).toContain('FETCH NEXT');
  });

  it('omits OFFSET/FETCH when unlimited=true is sent with date range', async () => {
    common.parseReportPagination.mockReturnValue({
      unlimited: true,
      offset: 1,
      skip: 0,
      take: 0,
    });

    const where = service.buildSpWhere({
      from_date: '2026-06-22',
      to_date: '2026-06-28',
    });
    expect(where).toContain("CAST(WorkDate AS DATE) >= CAST('2026-06-22' AS DATE)");
    expect(where).toContain("CAST(WorkDate AS DATE) <= CAST('2026-06-28' AS DATE)");

    await service.querySpEmployeeDailyReport({
      from_date: '2026-06-22',
      to_date: '2026-06-28',
      unlimited: 'true',
    });

    const sqlArg = prisma.$queryRaw.mock.calls[0][0];
    const sql = Array.isArray(sqlArg?.strings)
      ? sqlArg.strings.join('')
      : String(sqlArg);
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
  const prisma = { $queryRaw: jest.fn() };
  let service: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ cnt: 0 }]);
    service = new ReportQueryService(prisma, common);
  });

  const sqlText = () => {
    const sqlArg = prisma.$queryRaw.mock.calls[0][0];
    return Array.isArray(sqlArg?.strings) ? sqlArg.strings.join('') : String(sqlArg);
  };

  it('does not add WorkDate filters when no date params are sent', async () => {
    await service.querySpEmployeeDailyReport({});

    const sql = sqlText();
    expect(sql).not.toContain('WorkDate >=');
    expect(sql).not.toContain('WorkDate <=');
    expect(sql).not.toMatch(/WorkDate =/);
  });

  it('applies from_date and to_date independently', async () => {
    const where = service.buildSpWhere({
      from_date: '2026-06-01',
      to_date: '2026-06-30',
    });

    expect(where).toContain("CAST(WorkDate AS DATE) >= CAST('2026-06-01' AS DATE)");
    expect(where).toContain("CAST(WorkDate AS DATE) <= CAST('2026-06-30' AS DATE)");
  });

  it('applies only from_date when to_date is omitted', async () => {
    const where = service.buildSpWhere({ from_date: '2026-06-01' });

    expect(where).toContain("CAST(WorkDate AS DATE) >= CAST('2026-06-01' AS DATE)");
    expect(where).not.toContain('CAST(WorkDate AS DATE) <=');
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

  it('maps isabsent=true to Absent/WeekOff string values', () => {
    const where = service.buildSpWhere({ isabsent: 'true' });
    expect(where).toContain("IsAbsent IN ('Absent', 'WeekOff')");
  });

  it('maps isabsent=false to present employees', () => {
    const where = service.buildSpWhere({ isabsent: 'false' });
    expect(where).toContain("IsAbsent NOT IN ('Absent', 'WeekOff')");
  });

  it('applies organization and employee type filters together', () => {
    common.parseNumberArray.mockImplementation((value: unknown) => {
      const n = Number(value);
      return n === 26 ? [26] : [];
    });
    const where = service.buildSpWhere({
      organization_id: 25,
      employee_type_ids: 26,
    });
    expect(where).toContain('OrganizationID = 25');
    expect(where).toContain('EmployeeTypeID IN (26)');
  });

  it('applies department and employee_ids filters', () => {
    common.parseNumberArray.mockImplementation((value: unknown) => {
      if (String(value).includes('74026')) return [74026, 7755, 7760];
      return [];
    });
    const where = service.buildSpWhere({
      department_id: 524,
      employee_ids: '74026,7755,7760',
    });
    expect(where).toContain('DepartmentID = 524');
    expect(where).toContain('EmployeeID IN (74026,7755,7760)');
  });

  it('accepts cost_code and cost_center aliases', () => {
    const where = service.buildSpWhere({
      cost_code: 'IT-OPS',
      cost_center: 'CC-IT-001',
    });
    expect(where).toContain("CostCode = 'IT-OPS'");
    expect(where).toContain("CostCenter = 'CC-IT-001'");
  });
});
