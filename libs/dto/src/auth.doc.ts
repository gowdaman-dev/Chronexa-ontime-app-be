import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LoginDto, LoginResponseDto, RefreshTokenDto, LogoutResponseDto } from './auth.dto';

export function ApiLoginProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'john.doe', description: 'User login name', ...options }),
  );
}

export function ApiPasswordProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'P@ssw0rd!', description: 'User password', ...options }),
  );
}

export function ApiAccessTokenProperty() {
  return applyDecorators(
    ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'JWT access token' }),
  );
}

export function ApiRefreshTokenProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'a1b2c3d4e5f6...', description: 'Refresh token', ...options }),
  );
}

export function ApiUserProperty() {
  return applyDecorators(
    ApiProperty({
      description: 'User information',
      example: {
        userId: 1,
        login: 'john.doe',
        employeeId: 100,
        employeeName: 'John Doe',
        email: 'john@example.com',
        accessControlPanel: true,
        accessMobileApp: true,
        roles: ['Admin', 'Employee'],
      },
    }),
  );
}

export function ApiEmailProperty() {
  return applyDecorators(
    ApiProperty({ example: 'user@example.com', description: 'Registered email' }),
  );
}

export function ApiTokenProperty() {
  return applyDecorators(
    ApiProperty({ example: 'reset-token-abc123', description: 'Reset token' }),
  );
}

export function ApiNewPasswordProperty() {
  return applyDecorators(
    ApiProperty({ example: 'NewP@ssw0rd!', description: 'New password' }),
  );
}

export function ApiCurrentPasswordProperty() {
  return applyDecorators(
    ApiProperty({ example: 'CurrentP@ssw0rd!', description: 'Current password' }),
  );
}

export function ApiSuccessProperty() {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Operation success status' }),
  );
}

export function ApiMessageProperty() {
  return applyDecorators(
    ApiProperty({ example: 'Operation completed successfully', description: 'Response message' }),
  );
}

export function ApiAdTokenProperty() {
  return applyDecorators(
    ApiProperty({ example: 'eyJ0eXAiOiJKV1QiL...', description: 'Azure AD token' }),
  );
}

export function ApiLoginOperation() {
  return applyDecorators(
    ApiOperation({ summary: 'Authenticate with credentials', description: 'Local login with login/password credentials' }),
    ApiBody({ type: LoginDto }),
    ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto }),
    ApiResponse({ status: 401, description: 'Invalid login or password' }),
    ApiResponse({ status: 403, description: 'Access denied' }),
  );
}

export function ApiAdLoginOperation() {
  return applyDecorators(
    ApiOperation({ summary: 'Azure AD login', description: 'Authenticate using Azure AD token' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: { adToken: { type: 'string', example: 'eyJ0eXAiOiJKV1QiL...', description: 'Azure AD token' } },
      },
    }),
    ApiResponse({ status: 200, description: 'AD login successful', type: LoginResponseDto }),
    ApiResponse({ status: 401, description: 'Invalid AD token' }),
  );
}

export function ApiRefreshTokenOperation() {
  return applyDecorators(
    ApiOperation({ summary: 'Refresh access token', description: 'Get a new access token using a refresh token' }),
    ApiBody({ type: RefreshTokenDto }),
    ApiResponse({ status: 200, description: 'Token refreshed', type: LoginResponseDto }),
    ApiResponse({ status: 401, description: 'Invalid refresh token' }),
  );
}

export function ApiLogoutOperation() {
  return applyDecorators(
    ApiOperation({ summary: 'Logout', description: 'Invalidate refresh token to end session' }),
    ApiBody({ type: RefreshTokenDto }),
    ApiResponse({ status: 200, description: 'Logged out successfully', type: LogoutResponseDto }),
  );
}

export function ApiForgotPasswordOperation() {
  return applyDecorators(
    ApiOperation({ summary: 'Forgot password', description: 'Request password reset email' }),
    ApiResponse({ status: 200, description: 'Reset email sent' }),
  );
}

export function ApiResetPasswordOperation() {
  return applyDecorators(
    ApiOperation({ summary: 'Reset password', description: 'Reset password using reset token' }),
    ApiResponse({ status: 200, description: 'Password reset successful' }),
  );
}

export function ApiChangePasswordOperation() {
  return applyDecorators(
    ApiOperation({ summary: 'Change password', description: 'Change password for authenticated user' }),
    ApiResponse({ status: 200, description: 'Password changed successfully' }),
  );
}

export class LoginResponseExample {
  @Type(() => String)
  accessToken!: string;

  @Type(() => String)
  refreshToken!: string;

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
