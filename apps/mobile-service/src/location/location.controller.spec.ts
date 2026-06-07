const { MobileLocationController } = require('./location.controller');

describe('MobileLocationController', () => {
  let service: any;
  let controller: any;

  beforeEach(() => {
    service = {
      getMyWorkLocation: jest.fn(),
      verifyAssignedLocation: jest.fn(),
      verifyLocation: jest.fn(),
    };
    controller = new MobileLocationController(service);
  });

  it('routes work location requests to the location service', async () => {
    service.getMyWorkLocation.mockResolvedValue({ data: {} });

    await controller.getMyWorkLocation({ employeeId: 123 });

    expect(service.getMyWorkLocation).toHaveBeenCalledWith(123);
  });

  it('routes assigned location verification with employee id and coordinates', async () => {
    service.verifyAssignedLocation.mockResolvedValue({ success: true });

    await controller.verifyAssignedLocation({
      employeeId: 123,
      coordinates: [25.2048, 55.2708],
    });

    expect(service.verifyAssignedLocation).toHaveBeenCalledWith(123, [
      25.2048,
      55.2708,
    ]);
  });

  it('routes global location verification with coordinates', async () => {
    service.verifyLocation.mockResolvedValue({ success: true });

    await controller.verifyLocation({ coordinates: [25.2048, 55.2708] });

    expect(service.verifyLocation).toHaveBeenCalledWith([25.2048, 55.2708]);
  });
});
