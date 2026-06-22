const { PermissionTypesController } = require('./permission-types.controller');

describe('PermissionTypesController', () => {
  let service: any;
  let controller: any;

  beforeEach(() => {
    service = {
      all: jest.fn(),
      active: jest.fn(),
      byGender: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
      edit: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      search: jest.fn(),
    };
    controller = new PermissionTypesController(service);
  });

  it('routes list requests to the service', async () => {
    const payload = { query: { search: 'perm' } };
    await controller.all(payload);
    expect(service.all).toHaveBeenCalledWith(payload);
  });

  it('routes by-gender requests to the service', async () => {
    const payload = { gender: 'M' };
    await controller.byGender(payload);
    expect(service.byGender).toHaveBeenCalledWith(payload);
  });

  it('routes search requests to the service', async () => {
    const payload = { query: { search: 'personal' } };
    await controller.search(payload);
    expect(service.search).toHaveBeenCalledWith(payload);
  });
});
