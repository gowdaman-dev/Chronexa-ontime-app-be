import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './user.dto';

export function ApiLoginProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'john.doe', description: 'User login name', ...options }),
  );
}

export function ApiPasswordProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'P@ssw0rd!', description: 'User password', maxLength: 256, ...options }),
  );
}

export function ApiEmployeeIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 100, description: 'Employee ID', ...options }),
  );
}

export function ApiCreatedIdProperty() {
  return applyDecorators(
    ApiProperty({ example: 1, description: 'ID of user who created this record' }),
  );
}

export function ApiLastUpdatedIdProperty() {
  return applyDecorators(
    ApiProperty({ example: 1, description: 'ID of user who last updated this record' }),
  );
}

export function ApiAccessControlPanelProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Has access to control panel', ...options }),
  );
}

export function ApiAccessMobileAppProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Has access to mobile app', ...options }),
  );
}

export function ApiIsAdUserProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: false, description: 'Is Azure AD user', ...options }),
  );
}

export function ApiAppTypeProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'web', description: 'Application type', ...options }),
  );
}

export function ApiActiveUserProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Is active user', ...options }),
  );
}

export function ApiLastLoginProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: '2026-06-03T10:30:00Z', description: 'Last login timestamp', ...options }),
  );
}

export function ApiCreatedDateProperty() {
  return applyDecorators(
    ApiProperty({ example: '2026-01-15T08:00:00Z', description: 'Record creation timestamp' }),
  );
}

export function ApiLastUpdatedDateProperty() {
  return applyDecorators(
    ApiProperty({ example: '2026-06-03T10:30:00Z', description: 'Record last update timestamp' }),
  );
}

export function ApiUserIdProperty() {
  return applyDecorators(
    ApiProperty({ example: 1, description: 'Unique user ID' }),
  );
}

export function ApiEmployeeNameProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'John Doe', description: 'Employee full name', ...options }),
  );
}

export function ApiEmailProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'john@example.com', description: 'Email address', ...options }),
  );
}

export function ApiCreateUserBody() {
  return applyDecorators(
    ApiBody({ type: CreateUserDto }),
  );
}

export function ApiUpdateUserBody() {
  return applyDecorators(
    ApiBody({ type: UpdateUserDto }),
  );
}

export function ApiCreateUserOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Create a new user account', description: 'Create a new user with employee association and access permissions' }),
    ApiBody({ type: CreateUserDto }),
    ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetAllUsersOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'List all user accounts', description: 'Retrieve a paginated list of all registered users' }),
    ApiResponse({
      status: 200,
      description: 'Paginated list of users',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { $ref: '#/components/schemas/UserResponseDto' } },
          total: { type: 'number', example: 100 },
          hasNext: { type: 'boolean', example: true },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetUserByIdOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get user by ID', description: 'Retrieve a single user by their unique ID' }),
    ApiParam({ name: 'id', type: Number, description: 'User ID', example: 1 }),
    ApiResponse({ status: 200, description: 'User details retrieved', type: UserResponseDto }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}

export function ApiUpdateUserOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update user account', description: 'Update an existing user\'s details and permissions' }),
    ApiParam({ name: 'id', type: Number, description: 'User ID', example: 1 }),
    ApiBody({ type: UpdateUserDto }),
    ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}

export function ApiDeleteUserOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Delete user account', description: 'Permanently delete a user account' }),
    ApiParam({ name: 'id', type: Number, description: 'User ID', example: 1 }),
    ApiResponse({ status: 204, description: 'User deleted successfully' }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}
