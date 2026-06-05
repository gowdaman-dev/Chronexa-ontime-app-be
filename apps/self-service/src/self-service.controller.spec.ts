import { Test, TestingModule } from '@nestjs/testing';
import { SelfServiceController } from './self-service.controller';
import { SelfServiceService } from './self-service.service';

describe('SelfServiceController', () => {
  let selfServiceController: SelfServiceController;
  let selfServiceService: jest.Mocked<SelfServiceService>;

  beforeEach(async () => {
    selfServiceService = {
      getMyCheckInOut: jest.fn(),
      getMyWorkLocation: jest.fn(),
      getLastTransactions: jest.fn(),
      verifyAssignedLocation: jest.fn(),
      verifyLocation: jest.fn(),
      getSparkTodayLocation: jest.fn(),
      punch: jest.fn(),
      verifyEncounter: jest.fn(),
    } as unknown as jest.Mocked<SelfServiceService>;

    const app: TestingModule = await Test.createTestingModule({
      controllers: [SelfServiceController],
      providers: [{ provide: SelfServiceService, useValue: selfServiceService }],
    }).compile();

    selfServiceController = app.get<SelfServiceController>(SelfServiceController);
  });

  describe('message handlers', () => {
    it('delegates my-check-in-out messages to the service', async () => {
      selfServiceService.getMyCheckInOut.mockResolvedValue({
        message: "Today's check-in/check-out fetched successfully",
        data: { checkIn: null, checkOut: null },
      });

      await selfServiceController.getMyCheckInOut({ employeeId: 123 });

      expect(selfServiceService.getMyCheckInOut).toHaveBeenCalledWith(123);
    });

    it('delegates assigned-location verification messages to the service', async () => {
      selfServiceService.verifyAssignedLocation.mockResolvedValue({
        success: true,
        message: 'Location verified successfully. You are within the allowed work location.',
      });

      await selfServiceController.verifyAssignedLocation({
        employeeId: 123,
        coordinates: [25.2048, 55.2708],
      });

      expect(selfServiceService.verifyAssignedLocation).toHaveBeenCalledWith(123, [
        25.2048,
        55.2708,
      ]);
    });

    it('delegates IDS verify-encounter messages to the service', async () => {
      selfServiceService.verifyEncounter.mockResolvedValue({
        success: true,
        message: 'Verification successful',
        subject: {},
      });

      await selfServiceController.verifyEncounter({
        employeeId: 123,
        file: { buffer: Buffer.from('image') },
        body: { reason: 'OUT', subjectId: 'E001', geolocation: '25.2048,55.2708' },
      });

      expect(selfServiceService.verifyEncounter).toHaveBeenCalledWith({
        employeeId: 123,
        file: { buffer: Buffer.from('image') },
        body: { reason: 'OUT', subjectId: 'E001', geolocation: '25.2048,55.2708' },
      });
    });
  });
});
