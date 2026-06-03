import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError } from 'rxjs';

@Injectable()
export class AuthServiceService {
  constructor(@Inject('AUTH_SERVICE') private readonly client: ClientProxy) {}

  private async send<T>(pattern: any, data?: any): Promise<T> {
    return firstValueFrom(
      this.client.send<T>(pattern, data ?? {}).pipe(
        catchError((err: any) => {
          if (err?.statusCode) {
            return throwError(
              () => new HttpException(err.message, err.statusCode),
            );
          }
          return throwError(
            () =>
              new HttpException(
                'Service unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
              ),
          );
        }),
      ),
    );
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

  validateToken(token: string) {
    return this.send('auth.validate_token', { token });
  }
}
