import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_VALIDATOR, IS_PUBLIC_KEY } from '../auth.constants';
import type { IAuthService } from '../interfaces/auth-service.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_VALIDATOR) private readonly authValidator: IAuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const result = await this.authValidator.validateToken(
      token,
      request.headers?.['user-agent'],
    );

    if (!result.valid || !result.user) {
      throw new UnauthorizedException(result.message ?? 'Invalid or expired token');
    }

    request.user = result.user;
    return true;
  }

  private extractToken(request: any): string | null {
    const auth = request.headers?.authorization;
    if (!auth) return null;
    const [, token] = auth.split(' ');
    return token ?? null;
  }
}
