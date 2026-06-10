const { MobileSparkController } = require('./spark.controller');

describe('MobileSparkController', () => {
  let service: any;
  let controller: any;

  beforeEach(() => {
    service = {
      getSparkTodayLocation: jest.fn(),
    };
    controller = new MobileSparkController(service);
  });

  it('routes Spark today location requests to the Spark service', async () => {
    service.getSparkTodayLocation.mockResolvedValue({ data: {} });

    await controller.getSparkTodayLocation({ employeeId: 123 });

    expect(service.getSparkTodayLocation).toHaveBeenCalledWith(123);
  });
});
