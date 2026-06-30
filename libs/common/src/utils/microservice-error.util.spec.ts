import { microserviceFail, runMicroserviceAction } from './microservice-error.util';
import { AppLoggerService } from '../services/app-logger.service';

describe('microservice-error.util', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  } as unknown as AppLoggerService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws RpcException via microserviceFail', () => {
    expect(() => microserviceFail(logger, 400, 'Bad request')).toThrow();
  });

  it('maps Prisma P2003 to invalid reference', async () => {
    await expect(
      runMicroserviceAction(logger, 'test', async () => {
        throw { code: 'P2003' };
      }),
    ).rejects.toThrow('Invalid reference ID');
  });
});
