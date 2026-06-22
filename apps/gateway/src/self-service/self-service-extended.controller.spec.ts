const { SelfServiceExtendedController } = require('./self-service-extended.controller');

describe('SelfServiceExtendedController', () => {
  let service: any;
  let controller: any;
  const user = {
    userId: 10,
    employeeId: 123,
    login: 'admin.user',
    role: 'Admin',
    employeeType: 'Professional',
    isADUser: false,
  };

  beforeEach(() => {
    service = { workflow: jest.fn().mockResolvedValue({ success: true }) };
    controller = new SelfServiceExtendedController(service);
  });

  it('forwards leave type list with query filters', async () => {
    await controller.getAllLeaveTypes({ search: 'annual', limit: 10, offset: 1 });

    expect(service.workflow).toHaveBeenCalledWith('self_service.leave_types.all', {
      query: { search: 'annual', limit: 10, offset: 1 },
    });
  });

  it('forwards leave type create with user payload', async () => {
    await controller.addLeaveType(user, { leave_type_code: 'AL', leave_type_eng: 'Annual' });

    expect(service.workflow).toHaveBeenCalledWith('self_service.leave_types.add', {
      user: {
        userId: 10,
        employeeId: 123,
        login: 'admin.user',
        role: 'Admin',
        employeeType: 'Professional',
        isADUser: false,
      },
      body: { leave_type_code: 'AL', leave_type_eng: 'Annual' },
    });
  });

  it('forwards report attendance with user and query', async () => {
    const query = { from_date: '2025-01-01', to_date: '2025-06-30', department_id: 1 };
    const res = { setHeader: jest.fn(), send: jest.fn() };
    await controller.getAttendanceReport(user, query, res);

    expect(service.workflow).toHaveBeenCalledWith('self_service.reports.attendance', {
      user: expect.objectContaining({ employeeId: 123 }),
      query,
    });
  });

  it('forwards event transaction create', async () => {
    const body = { employee_id: 123, reason: 'IN', transaction_time: '2026-06-10T08:00:00' };
    await controller.addEventTransaction(user, body);

    expect(service.workflow).toHaveBeenCalledWith('self_service.event_transactions.add', {
      user: expect.objectContaining({ employeeId: 123 }),
      body,
    });
  });

  it('forwards event transaction verify', async () => {
    const body = {
      employee_id: 123,
      reason: 'IN',
      time_stamp: '2026-06-10T08:00:00',
      coordinates: [25.2048, 55.2708],
    };
    await controller.verifyEventTransaction(user, body);

    expect(service.workflow).toHaveBeenCalledWith('self_service.event_transactions.verify', {
      user: expect.objectContaining({ employeeId: 123 }),
      body,
    });
  });
});
