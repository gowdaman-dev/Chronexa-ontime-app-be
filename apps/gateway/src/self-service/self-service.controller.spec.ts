const { MobileSelfServiceController } = require('./controllers/mobile.controller');

describe('MobileSelfServiceController', () => {
  let service: any;
  let controller: any;
  const user = {
    userId: 10,
    employeeId: 123,
    login: 'mobile.user',
    role: 'Employee',
    employeeType: 'Professional',
    isADUser: false,
  };

  beforeEach(() => {
    service = {
      getMyCheckInOut: jest.fn(),
      getMyWorkLocation: jest.fn(),
      getLastTransactions: jest.fn(),
      verifyAssignedLocation: jest.fn(),
      verifyLocation: jest.fn(),
      getSparkTodayLocation: jest.fn(),
      punch: jest.fn(),
      verifyEncounter: jest.fn(),
    } as any;
    controller = new MobileSelfServiceController(service);
  });

  it('passes current employee id to my-check-in-out', async () => {
    service.getMyCheckInOut.mockResolvedValue({ data: { checkIn: null, checkOut: null } });

    await controller.getMyCheckInOut(user);

    expect(service.getMyCheckInOut).toHaveBeenCalledWith(123);
  });

  it('passes current employee id and coordinates to assigned location verification', async () => {
    service.verifyAssignedLocation.mockResolvedValue({ success: true });

    await controller.verifyAssignedLocation(user, { coordinates: [25.2048, 55.2708] });

    expect(service.verifyAssignedLocation).toHaveBeenCalledWith(123, {
      coordinates: [25.2048, 55.2708],
    });
  });

  it('passes file, body, and request metadata to IDS punch', async () => {
    const file = {
      buffer: Buffer.from('image'),
      originalname: 'face.jpg',
      mimetype: 'image/jpeg',
      size: 5,
    } as any;
    service.punch.mockResolvedValue({ success: true });

    await controller.punch(user, file, { reason: 'IN', geolocation: '25.2048,55.2708' }, {
      headers: { 'user-agent': 'dart/', 'app-version': '1.0.0' },
    } as any);

    expect(service.punch).toHaveBeenCalledWith({
      employeeId: 123,
      file: {
        originalname: 'face.jpg',
        mimetype: 'image/jpeg',
        size: 5,
        bufferBase64: Buffer.from('image').toString('base64'),
      },
      body: { reason: 'IN', geolocation: '25.2048,55.2708' },
      userAgent: 'dart/',
      appVersion: '1.0.0',
    });
  });
});
