import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service';

@Controller()
export class AuthServiceController {
  constructor(private readonly authService: AuthServiceService) {}

  @MessagePattern('auth.login')
  login(
    @Payload() data: { login: string; password: string; userAgent?: string },
  ) {
    return this.authService.login(data.login, data.password, data.userAgent);
  }

  @MessagePattern('auth.ad_login')
  adLogin(@Payload() data: { adToken: string; userAgent?: string }) {
    return this.authService.adLogin(data.adToken, data.userAgent);
  }

  @MessagePattern('auth.logout')
  logout(@Payload() data: { refreshToken: string }) {
    return this.authService.logout(data.refreshToken);
  }

  @MessagePattern('auth.validate_token')
  validateToken(@Payload() data: { token: string; userAgent?: string }) {
    return this.authService.validateToken(data.token, data.userAgent);
  }
}
