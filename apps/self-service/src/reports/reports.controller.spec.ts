const { ReportsController } = require('./reports.controller');

describe('ReportsController', () => {
  let service: any;
  let controller: any;

  beforeEach(() => {
    service = {
      daily: jest.fn(),
      weekly: jest.fn(),
      monthly: jest.fn(),
      attendance: jest.fn(),
    };
    controller = new ReportsController(service);
  });

  it('routes daily report requests to the service', async () => {
    const payload = { query: { format: 'json' }, user: { employeeId: 123, role: 'Admin' } };
    await controller.daily(payload);
    expect(service.daily).toHaveBeenCalledWith(payload);
  });

  it('routes attendance report requests to the service', async () => {
    const payload = { query: { department_id: 1 }, user: { employeeId: 123, role: 'Admin' } };
    await controller.attendance(payload);
    expect(service.attendance).toHaveBeenCalledWith(payload);
  });
});
