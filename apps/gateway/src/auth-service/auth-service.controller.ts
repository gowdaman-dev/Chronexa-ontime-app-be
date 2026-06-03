import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '@app/auth';
import { AuthServiceService } from './auth-service.service';
import { LoginDto, RefreshTokenDto } from '@app/dto';
import {
  ApiLoginOperation,
  ApiAdLoginOperation,
  ApiLogoutOperation,
} from '@app/dto/auth.doc';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthServiceController {
  constructor(private readonly authService: AuthServiceService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiLoginOperation()
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto.login, dto.password, req.headers['user-agent']);
  }

  @Post('ad-login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiAdLoginOperation()
  adLogin(@Body() dto: { adToken: string }, @Req() req: Request) {
    return this.authService.adLogin(dto.adToken, req.headers['user-agent']);
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiLogoutOperation()
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }
}
