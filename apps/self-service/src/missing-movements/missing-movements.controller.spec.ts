const {
  MissingMovementsController,
} = require('./missing-movements.controller');

describe('MissingMovementsController', () => {
  let service: any;
  let controller: any;

  beforeEach(() => {
    service = {
      all: jest.fn(),
      teamAll: jest.fn(),
    };
    controller = new MissingMovementsController(service);
  });

  it('routes all requests to the service', async () => {
    const payload = { query: {} };

    await controller.all(payload);

    expect(service.all).toHaveBeenCalledWith(payload);
  });

  it('routes team requests to the service', async () => {
    const payload = { user: { employeeId: 123 }, query: {} };

    await controller.teamAll(payload);

    expect(service.teamAll).toHaveBeenCalledWith(payload);
  });
});
