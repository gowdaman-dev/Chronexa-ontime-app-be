import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@app/prisma';
import { getAppTypeFromUserAgent } from '@app/auth';

@Injectable()
export class AppValidatorService {
  constructor(private readonly prisma: PrismaService) {}

  async validateAppAccess(userId: number, userAgent?: string): Promise<void> {
    const clientAppType = getAppTypeFromUserAgent(userAgent);
    const user = await this.prisma.sec_users.findFirst({
      where: { user_id: userId },
    });

    if (!user) {
      throw new RpcException({
        statusCode: 401,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (!user.access_mobile_app) {
      throw new RpcException({
        statusCode: 401,
        message: 'User does not have permission to access mobile app',
        code: 'MOBILE_ACCESS_DENIED',
      });
    }

    switch (user.app_type) {
      case 'ontime':
        if (clientAppType !== 'ontime') {
          throw new RpcException({
            statusCode: 401,
            message:
              'You are not allowed to login via fieldtrack app. Please use the ontime app to login.',
            code: 'APP_TYPE_MISMATCH',
          });
        }
        break;
      case 'fieldtrack':
        if (clientAppType !== 'fieldtrack') {
          throw new RpcException({
            statusCode: 401,
            message:
              'You are not allowed to login via ontime app. Please use the fieldtrack app to login.',
            code: 'APP_TYPE_MISMATCH',
          });
        }
        break;
      default:
        throw new RpcException({
          statusCode: 401,
          message: 'Unknown user app type for mobile access',
          code: 'UNKNOWN_APP_TYPE',
        });
    }
  }

  async validateMobileToken(employeeId: number, accessToken: string): Promise<void> {
    const stored = await this.prisma.user_tokens.findFirst({
      where: { employee_id: employeeId },
      orderBy: { token_id: 'desc' },
    });

    if (!stored || stored.refresh_token !== accessToken) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid access token for mobile client',
        code: 'INVALID_TOKEN_MOBILE',
      });
    }
  }
}
