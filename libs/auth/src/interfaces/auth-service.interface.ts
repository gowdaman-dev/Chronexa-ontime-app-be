import { TokenValidationResult } from './auth-user.interface';

export interface IAuthService {
  validateToken(token: string): Promise<TokenValidationResult>;
}
