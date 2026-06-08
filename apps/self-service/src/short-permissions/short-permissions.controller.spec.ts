const {
  ShortPermissionsController,
} = require('./short-permissions.controller');

describe('ShortPermissionsController', () => {
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
      search: jest.fn(),
      deleteMany: jest.fn(),
      teamAll: jest.fn(),
    };
    controller = new ShortPermissionsController(service);
  });

  it('routes add requests to the service', async () => {
    const payload = { body: {}, user: { employeeId: 123 } };

    await controller.add(payload);

    expect(service.add).toHaveBeenCalledWith(payload);
  });

  it('routes search requests to the service', async () => {
    const payload = { query: { search: 'employee' } };

    await controller.search(payload);

    expect(service.search).toHaveBeenCalledWith(payload);
  });
});
