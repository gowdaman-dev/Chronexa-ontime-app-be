const { AttendanceService } = require('./attendance.service');

describe('AttendanceService', () => {
  let reportQuery: any;
  let service: any;

  beforeEach(() => {
    reportQuery = {
      querySpEmployeeDailyReport: jest.fn().mockResolvedValue({
        data: [{ EmployeeID: 100, WorkDate: '2025-06-01' }],
        total: 1,
        hasNext: false,
      }),
    };
    const common = {
      fail: jest.fn((statusCode: number, message: string) => {
        const error: any = new Error(message);
        error.getError = () => ({ statusCode, message });
        throw error;
      }),
      resolveEmployeeId: jest.fn((query: any) => query?.employee_id),
      isManagerRole: jest.fn(() => false),
    };
    const logger = { info: jest.fn(), error: jest.fn() };
    service = new AttendanceService(common, reportQuery, logger);
  });

  it('returns daily attendance from sp_employee_daily_report', async () => {
    await expect(
      service.daily({
        user: { employeeId: 100, role: 'Employee' },
        query: { from_date: '2025-01-01', to_date: '2025-06-30' },
      }),
    ).resolves.toEqual({
      success: true,
      data: [{ EmployeeID: 100, WorkDate: '2025-06-01' }],
      total: 1,
      hasNext: false,
    });

    expect(reportQuery.querySpEmployeeDailyReport).toHaveBeenCalledWith(
      { from_date: '2025-01-01', to_date: '2025-06-30' },
      { employeeId: 100 },
    );
  });
});
