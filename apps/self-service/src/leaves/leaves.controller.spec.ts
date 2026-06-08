const { LeavesController } = require('./leaves.controller');

describe('LeavesController', () => {
  let service: any;
  let controller: any;

  beforeEach(() => {
    service = {
      add: jest.fn(),
      all: jest.fn(),
      pending: jest.fn(),
      get: jest.fn(),
      byEmployee: jest.fn(),
      approve: jest.fn(),
      edit: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      myRequests: jest.fn(),
      teamAll: jest.fn(),
    };
    controller = new LeavesController(service);
  });

  it('routes leave add requests to the service', async () => {
    const payload = { body: {}, user: { employeeId: 123 } };

    await controller.add(payload);

    expect(service.add).toHaveBeenCalledWith(payload);
  });

  it('routes team leave requests to the service', async () => {
    const payload = { query: {}, user: { employeeId: 123 } };

    await controller.teamAll(payload);

    expect(service.teamAll).toHaveBeenCalledWith(payload);
  });
});
