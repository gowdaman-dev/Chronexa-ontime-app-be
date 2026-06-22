const { AttendanceController } = require('./attendance.controller');

describe('AttendanceController', () => {
  let service: any;
  let controller: any;

  beforeEach(() => {
    service = { daily: jest.fn() };
    controller = new AttendanceController(service);
  });

  it('routes daily attendance requests to the service', async () => {
    const payload = { query: { from_date: '2025-01-01' }, user: { employeeId: 123, role: 'Employee' } };
    await controller.daily(payload);
    expect(service.daily).toHaveBeenCalledWith(payload);
  });
});
