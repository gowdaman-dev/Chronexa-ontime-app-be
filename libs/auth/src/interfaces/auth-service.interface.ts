import { TokenValidationResult } from './auth-user.interface';

export interface IAuthService {
  validateToken(token: string, userAgent?: string): Promise<TokenValidationResult>;
}
