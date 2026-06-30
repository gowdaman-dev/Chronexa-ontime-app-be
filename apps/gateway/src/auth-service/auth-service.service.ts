import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { IAuthService, TokenValidationResult, AuthUser } from '@app/auth';
import { AppLoggerService, sendRpc } from '@app/common';

@Injectable()
export class AuthServiceService implements IAuthService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly client: ClientProxy,
    private readonly config: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  private send<T>(pattern: string, data?: any): Promise<T> {
    return sendRpc<T>(
      this.client,
      pattern,
      data ?? {},
      this.logger,
      {
        rpcTimeoutMs: this.config.get<number>('rpcTimeoutMs'),
        pattern,
      },
    );
  }

  async validateToken(token: string, userAgent?: string): Promise<TokenValidationResult> {
    try {
      const payload: any = await this.send('auth.validate_token', { token, userAgent });
      if (!payload || !payload.userId) {
        return { valid: false, message: 'Invalid or expired token' };
      }
      const user: AuthUser = {
        userId: payload.userId,
        login: payload.login,
        employeeId: payload.employeeId ?? payload.sub,
        role: payload.role ?? 'Employee',
        employeeType: payload.employeeType ?? 'Professional',
        isADUser: payload.isADUser ?? false,
      };
      return { valid: true, user };
    } catch (err: any) {
      const message =
        err?.response?.message ??
        (Array.isArray(err?.response?.message) ? err.response.message[0] : undefined) ??
        err?.message ??
        'Token validation failed';
      return { valid: false, message };
    }
  }

  login(login: string, password: string, userAgent?: string) {
    return this.send('auth.login', { login, password, userAgent });
  }

  adLogin(adToken: string, userAgent?: string) {
    return this.send('auth.ad_login', { adToken, userAgent });
  }

  logout(refreshToken: string) {
    return this.send('auth.logout', { refreshToken });
  }
}
