import { Test, TestingModule } from '@nestjs/testing';
import { SelfServiceController } from './self-service.controller';
import { SelfServiceService } from './self-service.service';

describe('SelfServiceController', () => {
  let selfServiceController: SelfServiceController;
  let selfServiceService: jest.Mocked<SelfServiceService>;

  beforeEach(async () => {
    selfServiceService = {
      punch: jest.fn(),
    } as unknown as jest.Mocked<SelfServiceService>;

    const app: TestingModule = await Test.createTestingModule({
      controllers: [SelfServiceController],
      providers: [{ provide: SelfServiceService, useValue: selfServiceService }],
    }).compile();

    selfServiceController = app.get<SelfServiceController>(SelfServiceController);
  });

  describe('message handlers', () => {
    it('delegates IDS punch messages to the service', async () => {
      selfServiceService.punch.mockResolvedValue({
        success: true,
        message: 'Verification successful',
        subject: {},
      });

      const payload = {
        employeeId: 123,
        file: { buffer: Buffer.from('image') },
        body: { reason: 'OUT', geolocation: '25.2048,55.2708' },
      };

      await selfServiceController.punch(payload);

      expect(selfServiceService.punch).toHaveBeenCalledWith(payload);
    });
  });
});
