const { ReportsController } = require('./controllers/reports.controller');

describe('Report gateway controller', () => {
  let service: any;
  const user = {
    userId: 10,
    employeeId: 123,
    login: 'admin.user',
    role: 'Admin',
    employeeType: 'Professional',
    isADUser: false,
  };

  beforeEach(() => {
    service = { run: jest.fn().mockResolvedValue({ success: true }) };
  });

  it('forwards report attendance with user and query', async () => {
    const controller = new ReportsController(service);
    const query = { from_date: '2025-01-01', to_date: '2025-06-30', department_id: 1 };
    const res = { setHeader: jest.fn(), send: jest.fn() };
    await controller.getAttendanceReport(user, query, res);

    expect(service.run).toHaveBeenCalledWith('report.attendance', {
      user: expect.objectContaining({ employeeId: 123 }),
      query,
    });
  });
});
