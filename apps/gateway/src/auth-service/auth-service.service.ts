import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { IAuthService, TokenValidationResult, AuthUser } from '@app/auth';

@Injectable()
export class AuthServiceService implements IAuthService {
  constructor(@Inject('AUTH_SERVICE') private readonly client: ClientProxy) {}

  private async send<T>(pattern: any, data?: any): Promise<T> {
    return firstValueFrom(
      this.client.send<T>(pattern, data ?? {}).pipe(
        catchError((err: any) => {
          if (err?.statusCode) {
            return throwError(() => new HttpException(err.message, err.statusCode));
          }
          return throwError(() => new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE));
        }),
      ),
    );
  }

  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      const payload: any = await this.send('auth.validate_token', { token });
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
    } catch {
      return { valid: false, message: 'Token validation failed' };
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
