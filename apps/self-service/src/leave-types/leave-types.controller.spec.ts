const { LeaveTypesController } = require('./leave-types.controller');

describe('LeaveTypesController', () => {
  let service: any;
  let controller: any;

  beforeEach(() => {
    service = {
      all: jest.fn(),
      active: jest.fn(),
      dropdown: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
      edit: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    };
    controller = new LeaveTypesController(service);
  });

  it('routes list requests to the service', async () => {
    const payload = { query: { search: 'annual' } };
    await controller.all(payload);
    expect(service.all).toHaveBeenCalledWith(payload);
  });

  it('routes create requests to the service', async () => {
    const payload = { body: { leave_type_code: 'AL' }, user: { employeeId: 1 } };
    await controller.add(payload);
    expect(service.add).toHaveBeenCalledWith(payload);
  });

  it('routes bulk delete requests to the service', async () => {
    const payload = { body: { ids: [1, 2] } };
    await controller.deleteMany(payload);
    expect(service.deleteMany).toHaveBeenCalledWith(payload);
  });
});
