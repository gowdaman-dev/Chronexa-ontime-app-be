const {
  MobileTransactionsController,
} = require('./transactions.controller');

describe('MobileTransactionsController', () => {
  let service: any;
  let controller: any;

  beforeEach(() => {
    service = {
      getMyCheckInOut: jest.fn(),
      getLastTransactions: jest.fn(),
    };
    controller = new MobileTransactionsController(service);
  });

  it('routes check-in/out requests to the transactions service', async () => {
    service.getMyCheckInOut.mockResolvedValue({ data: {} });

    await controller.getMyCheckInOut({ employeeId: 123 });

    expect(service.getMyCheckInOut).toHaveBeenCalledWith(123);
  });

  it('routes last transaction requests to the transactions service', async () => {
    service.getLastTransactions.mockResolvedValue({ data: [] });

    await controller.getLastTransactions({ employeeId: 123 });

    expect(service.getLastTransactions).toHaveBeenCalledWith(123);
  });
});
