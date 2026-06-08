const {
  ManualTransactionsController,
} = require('./manual-transactions.controller');

describe('ManualTransactionsController', () => {
  let service: any;
  let controller: any;

  beforeEach(() => {
    service = {
      add: jest.fn(),
      all: jest.fn(),
      get: jest.fn(),
      edit: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      teamAll: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      groupApproveTransactions: jest.fn(),
      groupApproveByEmployeeIds: jest.fn(),
    };
    controller = new ManualTransactionsController(service);
  });

  it('routes add requests to the service', async () => {
    const payload = { body: {}, user: { employeeId: 123 } };

    await controller.add(payload);

    expect(service.add).toHaveBeenCalledWith(payload);
  });

  it('routes group approve by employee ids requests to the service', async () => {
    const payload = { body: { employeeIds: [1] }, user: { employeeId: 123 } };

    await controller.groupApproveByEmployeeIds(payload);

    expect(service.groupApproveByEmployeeIds).toHaveBeenCalledWith(payload);
  });
});
