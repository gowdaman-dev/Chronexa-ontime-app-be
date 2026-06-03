import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  ApiLoginProperty,
  ApiPasswordProperty,
  ApiAccessTokenProperty,
  ApiRefreshTokenProperty,
  ApiUserProperty,
  ApiEmailProperty,
  ApiTokenProperty,
  ApiNewPasswordProperty,
  ApiCurrentPasswordProperty,
  ApiSuccessProperty,
  ApiMessageProperty,
} from './auth.doc';

export class LoginDto {
  @ApiLoginProperty()
  @IsString()
  @IsNotEmpty()
  login!: string;

  @ApiPasswordProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class LoginResponseDto {
  @ApiAccessTokenProperty()
  accessToken!: string;

  @ApiRefreshTokenProperty()
  refreshToken!: string;

  @ApiUserProperty()
  user!: {
    userId: number;
    login: string;
    employeeId: number;
    employeeName: string;
    email: string | null;
    accessControlPanel: boolean | null;
    accessMobileApp: boolean | null;
    roles: string[];
  };
}

export class RefreshTokenDto {
  @ApiRefreshTokenProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiEmailProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class ResetPasswordDto {
  @ApiTokenProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiNewPasswordProperty()
  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiCurrentPasswordProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiNewPasswordProperty()
  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}

export class LogoutResponseDto {
  @ApiSuccessProperty()
  success!: boolean;

  @ApiMessageProperty()
  message!: string;
}
