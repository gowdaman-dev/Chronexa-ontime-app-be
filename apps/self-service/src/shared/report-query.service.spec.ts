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
});
