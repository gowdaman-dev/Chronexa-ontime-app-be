import { Test, TestingModule } from '@nestjs/testing';
import { SelfServiceController } from './self-service.controller';
import { SelfServiceService } from './self-service.service';

describe('SelfServiceController', () => {
  let selfServiceController: SelfServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SelfServiceController],
      providers: [SelfServiceService],
    }).compile();

    selfServiceController = app.get<SelfServiceController>(SelfServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(selfServiceController.getHello()).toBe('Hello World!');
    });
  });
});
