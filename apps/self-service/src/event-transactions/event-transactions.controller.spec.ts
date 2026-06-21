const { EventTransactionsController } = require('./event-transactions.controller');

describe('EventTransactionsController', () => {
  let service: any;
  let controller: any;

  beforeEach(() => {
    service = {
      add: jest.fn(),
      addWithSubjectId: jest.fn(),
      all: jest.fn(),
      get: jest.fn(),
      byEmployee: jest.fn(),
      teamAll: jest.fn(),
      edit: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      myLastTransactions: jest.fn(),
      lastTransaction: jest.fn(),
      punchStatus: jest.fn(),
      todayStatus: jest.fn(),
      verify: jest.fn(),
    };
    controller = new EventTransactionsController(service);
  });

  it('routes create requests to the service', async () => {
    const payload = { body: { employee_id: 1, reason: 'IN' }, user: { employeeId: 1 } };
    await controller.add(payload);
    expect(service.add).toHaveBeenCalledWith(payload);
  });

  it('routes list requests to the service', async () => {
    const payload = { query: { from_date: '2025-01-01', to_date: '2025-12-31' } };
    await controller.all(payload);
    expect(service.all).toHaveBeenCalledWith(payload);
  });

  it('routes today status requests to the service', async () => {
    const payload = { query: { employee_id: 123 } };
    await controller.todayStatus(payload);
    expect(service.todayStatus).toHaveBeenCalledWith(payload);
  });

  it('routes verify requests to the service', async () => {
    const payload = {
      body: { employee_id: 100, reason: 'IN', time_stamp: '2026-06-10T08:00:00', coordinates: [25, 55] },
      user: { employeeId: 100 },
    };
    await controller.verify(payload);
    expect(service.verify).toHaveBeenCalledWith(payload);
  });
});
