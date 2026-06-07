import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptions,
  ApiResponse,
} from '@nestjs/swagger';
import { IdsPunchDto, IdsVerifyEncounterDto, VerifyLocationDto } from './self-service.dto';

export function ApiCoordinatesProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({
      type: [Number],
      example: [25.2048, 55.2708],
      minItems: 2,
      maxItems: 2,
      description: 'Latitude and longitude as [latitude, longitude]',
      ...options,
    }),
  );
}

export function ApiIdsReasonProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'IN', description: 'Punch reason, usually IN or OUT', ...options }),
  );
}

export function ApiGeolocationTextProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: '25.2048,55.2708', description: 'Punch geolocation text', ...options }),
  );
}

export function ApiUserEntryFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'true', description: 'User entry flag from the mobile app', ...options }),
  );
}

export function ApiDeviceIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: '1', description: 'Optional device identifier', ...options }),
  );
}

export function ApiSubjectIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'E001', description: 'IDS subject identifier', ...options }),
  );
}

export function ApiVerifyLocationOperation(summary: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiBody({ type: VerifyLocationDto }),
    ApiResponse({ status: 200, description: 'Location verified' }),
    ApiResponse({ status: 400, description: 'Invalid coordinates' }),
    ApiResponse({ status: 403, description: 'Not within allowed location' }),
  );
}

export function ApiIdsPunchOperation() {
  return applyDecorators(
    ApiOperation({ summary: 'Face recognition punch using IDS server' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['image', 'reason', 'geolocation'],
        properties: {
          image: { type: 'string', format: 'binary' },
          reason: { type: 'string', example: 'IN' },
          user_entry_flag: { type: 'string', example: 'true' },
          device_id: { type: 'string', example: '1' },
          geolocation: { type: 'string', example: '25.2048,55.2708' },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Verification successful' }),
    ApiResponse({ status: 400, description: 'Verification failed or invalid input' }),
  );
}

export function ApiIdsVerifyEncounterOperation() {
  return applyDecorators(
    ApiOperation({ summary: 'Face recognition 1:1 verification using IDS server' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['image', 'subjectId', 'reason', 'geolocation'],
        properties: {
          image: { type: 'string', format: 'binary' },
          subjectId: { type: 'string', example: 'E001' },
          reason: { type: 'string', example: 'IN' },
          user_entry_flag: { type: 'string', example: 'true' },
          device_id: { type: 'string', example: '1' },
          geolocation: { type: 'string', example: '25.2048,55.2708' },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Verification successful' }),
    ApiResponse({ status: 400, description: 'Verification failed or invalid input' }),
  );
}

export function ApiSimpleSelfServiceReadOperation(summary: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiResponse({ status: 200, description: 'Request completed successfully' }),
  );
}

export function ApiLastTransactionsOperation() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get recent mobile employee transactions',
      description:
        'Returns the authenticated employee transactions from the last 4 days, ordered by latest transaction id first. The employee id is taken from the access token.',
    }),
    ApiResponse({
      status: 200,
      description: 'Recent employee transactions fetched successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Last transactions fetched successfully',
              },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    transaction_id: { type: 'number', example: 12345 },
                    employee_id: { type: 'number', example: 1001 },
                    transaction_time: {
                      type: 'string',
                      format: 'date-time',
                      example: '2026-05-02T10:00:00.000Z',
                    },
                    reason: { type: 'string', example: 'IN' },
                    transaction_type: { type: 'string', example: 'IN' },
                    geolocation: {
                      type: 'string',
                      example: '25.2048,55.2708',
                    },
                    remarks: { type: 'string', example: 'Check IN via mobile' },
                  },
                },
              },
            },
          },
          example: {
            message: 'Last transactions fetched successfully',
            data: [
              {
                transaction_id: 12345,
                employee_id: 1001,
                transaction_time: '2026-05-02T10:00:00.000Z',
                reason: 'IN',
                transaction_type: 'IN',
                geolocation: '25.2048,55.2708',
                remarks: 'Check IN via mobile',
              },
            ],
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Invalid employee id in token context' }),
    ApiResponse({ status: 401, description: 'Missing or invalid access token' }),
    ApiResponse({ status: 500, description: 'Unexpected backend error' }),
  );
}

export type SelfServiceMultipartDto = IdsPunchDto | IdsVerifyEncounterDto;
