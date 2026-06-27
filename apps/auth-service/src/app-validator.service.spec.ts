import { RpcException } from '@nestjs/microservices';
import { AppValidatorService } from './app-validator.service';

describe('AppValidatorService', () => {
  const prisma = {
    sec_users: { findFirst: jest.fn() },
    user_tokens: { findFirst: jest.fn() },
  };
  let service: AppValidatorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AppValidatorService(prisma as any);
  });

  it('allows ontime user with ontime client', async () => {
    prisma.sec_users.findFirst.mockResolvedValue({
      user_id: 1,
      access_mobile_app: true,
      app_type: 'ontime',
    });
    await expect(
      service.validateAppAccess(1, 'dart/ontime'),
    ).resolves.toBeUndefined();
  });

  it('rejects ontime user with fieldtrack client', async () => {
    prisma.sec_users.findFirst.mockResolvedValue({
      user_id: 1,
      access_mobile_app: true,
      app_type: 'ontime',
    });
    await expect(service.validateAppAccess(1, 'dart/fieldtrack')).rejects.toBeInstanceOf(
      RpcException,
    );
  });

  it('rejects unknown app_type', async () => {
    prisma.sec_users.findFirst.mockResolvedValue({
      user_id: 1,
      access_mobile_app: true,
      app_type: 'other',
    });
    await expect(service.validateAppAccess(1, 'dart/ontime')).rejects.toBeInstanceOf(
      RpcException,
    );
  });

  it('rejects mobile token mismatch', async () => {
    prisma.user_tokens.findFirst.mockResolvedValue({
      refresh_token: 'stored-token',
    });
    await expect(
      service.validateMobileToken(77001, 'different-token'),
    ).rejects.toBeInstanceOf(RpcException);
  });
});
