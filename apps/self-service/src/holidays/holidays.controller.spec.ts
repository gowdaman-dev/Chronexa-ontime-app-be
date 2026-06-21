const { HolidaysController } = require('./holidays.controller');

describe('HolidaysController', () => {
  let service: any;
  let controller: any;

  beforeEach(() => {
    service = {
      all: jest.fn(),
      get: jest.fn(),
      upcoming: jest.fn(),
      search: jest.fn(),
      add: jest.fn(),
      edit: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    };
    controller = new HolidaysController(service);
  });

  it('routes list requests to the service', async () => {
    const payload = { query: { year: 2025 } };
    await controller.all(payload);
    expect(service.all).toHaveBeenCalledWith(payload);
  });

  it('routes upcoming requests to the service', async () => {
    const payload = { query: { days: 30 } };
    await controller.upcoming(payload);
    expect(service.upcoming).toHaveBeenCalledWith(payload);
  });

  it('routes create requests to the service', async () => {
    const payload = {
      body: { holiday_eng: 'Test', from_date: '2099-01-01', to_date: '2099-01-01' },
      user: { employeeId: 1 },
    };
    await controller.add(payload);
    expect(service.add).toHaveBeenCalledWith(payload);
  });
});
