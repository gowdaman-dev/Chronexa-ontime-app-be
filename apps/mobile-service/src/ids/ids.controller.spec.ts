const { MobileIdsController } = require('./ids.controller');

describe('MobileIdsController', () => {
  let service: any;
  let controller: any;

  beforeEach(() => {
    service = {
      verifyEncounter: jest.fn(),
    };
    controller = new MobileIdsController(service);
  });

  it('routes IDS verify encounter payloads to the IDS service', async () => {
    const payload = {
      employeeId: 123,
      body: {
        subjectId: 'EMP001',
        reason: 'IN',
        geolocation: '25.2048,55.2708',
      },
      file: { bufferBase64: Buffer.from('image').toString('base64') },
    };
    service.verifyEncounter.mockResolvedValue({ success: true });

    await controller.verifyEncounter(payload);

    expect(service.verifyEncounter).toHaveBeenCalledWith(payload);
  });
});
