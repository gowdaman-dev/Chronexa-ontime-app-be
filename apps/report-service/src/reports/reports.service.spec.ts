const { ReportsService } = require('./reports.service');

describe('ReportsService', () => {
  let reportQuery: any;
  let service: any;

  beforeEach(() => {
    reportQuery = {
      resolveDateRange: jest.fn(() => ({
        from_date: '2025-06-01',
        to_date: '2025-06-07',
      })),
      reportDateMeta: jest.fn(() => ({
        from_date: '2025-06-01',
        to_date: '2025-06-07',
      })),
      querySpEmployeeDailyReport: jest.fn().mockResolvedValue({
        data: [{ EmployeeID: 100 }],
        total: 1,
        hasNext: false,
      }),
      buildReportHtml: jest.fn(() => '<html>report</html>'),
    };
    const common = {
      fail: jest.fn((statusCode: number, message: string) => {
        const error: any = new Error(message);
        error.getError = () => ({ statusCode, message });
        throw error;
      }),
      resolveEmployeeId: jest.fn(),
      isManagerRole: jest.fn(() => false),
    };
    const logger = { info: jest.fn(), error: jest.fn() };
    const reportPdf = {
      htmlToPdfBuffer: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock')),
    };
    service = new ReportsService(common, reportQuery, reportPdf, logger);
  });

  it('returns JSON daily report', async () => {
    await expect(
      service.daily({
        user: { employeeId: 100, role: 'Admin' },
        query: { format: 'json' },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        success: true,
        period: 'daily',
        data: [{ EmployeeID: 100 }],
      }),
    );
  });

  it('returns HTML when format=html', async () => {
    await expect(
      service.monthly({
        user: { employeeId: 100, role: 'Admin' },
        query: { format: 'html' },
      }),
    ).resolves.toEqual({
      success: true,
      format: 'html',
      title: 'MONTHLY ATTENDANCE REPORT',
      html: '<html>report</html>',
      total: 1,
      hasNext: false,
    });
  });

  it('returns base64 PDF when format=pdf', async () => {
    await expect(
      service.weekly({
        user: { employeeId: 100, role: 'Admin' },
        query: { format: 'pdf' },
      }),
    ).resolves.toEqual({
      success: true,
      format: 'pdf',
      title: 'WEEKLY ATTENDANCE REPORT',
      pdfBase64: Buffer.from('%PDF-1.4 mock').toString('base64'),
      total: 1,
      hasNext: false,
    });
  });

  it('weekly passes from_date and to_date without expanding the week', async () => {
    reportQuery.resolveDateRange.mockImplementation(
      (period: string, query: Record<string, any>) => {
        if (query.from_date || query.to_date) {
          return {
            ...(query.from_date ? { from_date: String(query.from_date).slice(0, 10) } : {}),
            ...(query.to_date ? { to_date: String(query.to_date).slice(0, 10) } : {}),
          };
        }
        return {};
      },
    );

    await service.weekly({
      user: { employeeId: 100, role: 'Admin' },
      query: {
        from_date: '2026-06-22',
        to_date: '2026-06-28',
        unlimited: 'true',
      },
    });

    expect(reportQuery.resolveDateRange).toHaveBeenCalledWith('weekly', {
      from_date: '2026-06-22',
      to_date: '2026-06-28',
      unlimited: 'true',
    });
    const [query] = reportQuery.querySpEmployeeDailyReport.mock.calls.at(-1);
    expect(query).toEqual(
      expect.objectContaining({
        from_date: '2026-06-22',
        to_date: '2026-06-28',
      }),
    );
  });

  it('does not inject a default limit for pdf export', async () => {
    await service.daily({
      user: { employeeId: 100, role: 'Admin' },
      query: { format: 'pdf', date: '2025-06-01' },
    });
    const [query] = reportQuery.querySpEmployeeDailyReport.mock.calls.at(-1);
    expect(query.limit).toBeUndefined();
  });
});
