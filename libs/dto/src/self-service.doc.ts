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

type JsonExample = Record<string, unknown>;
type OpenApiSchema = Record<string, unknown>;

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

function schemaFromExample(example: unknown): OpenApiSchema {
  if (Array.isArray(example)) {
    return {
      type: 'array',
      items: schemaFromExample(example[0] ?? {}),
      example,
    };
  }

  if (example === null) {
    return {
      nullable: true,
      example: null,
    };
  }

  if (example instanceof Date) {
    return {
      type: 'string',
      format: 'date-time',
      example: example.toISOString(),
    };
  }

  switch (typeof example) {
    case 'string':
      return {
        type: 'string',
        example,
        ...(example.includes('T') && example.endsWith('Z')
          ? { format: 'date-time' }
          : {}),
      };
    case 'number':
      return { type: 'number', example };
    case 'boolean':
      return { type: 'boolean', example };
    case 'object': {
      const objectExample = example as Record<string, unknown>;
      return {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(objectExample).map(([key, value]) => [
            key,
            schemaFromExample(value),
          ]),
        ),
        example,
      };
    }
    default:
      return { example };
  }
}

function apiJsonResponse(
  status: number,
  description: string,
  example: JsonExample,
) {
  return ApiResponse({
    status,
    description,
    content: {
      'application/json': {
        schema: schemaFromExample(example),
        example,
        examples: {
          default: {
            summary: description,
            value: example,
          },
        },
      },
    },
  });
}

function apiErrorResponse(
  status: number,
  description: string,
  message: string,
) {
  return apiJsonResponse(status, description, {
    statusCode: status,
    message,
    error: description,
  });
}

const employeeSample = {
  employee_id: 1001,
  emp_no: 'E001',
  firstname_eng: 'John',
  lastname_eng: 'Doe',
  firstname_arb: 'John Arabic',
  lastname_arb: 'Doe Arabic',
  organization_id: 27,
  department_id: 5,
  manager_id: 900,
};

const leaveSample = {
  employee_leave_id: 13362,
  leave_type_id: 1,
  employee_id: 1001,
  from_date: '2026-06-10T00:00:00.000Z',
  to_date: '2026-06-11T00:00:00.000Z',
  number_of_leaves: 2,
  employee_remarks: 'Annual leave request',
  approve_reject_flag: 0,
  leave_status: 'PENDING',
  leave_doc_filename_path: '/uploads/leave-document.pdf',
  employee_master_employee_leaves_employee_idToemployee_master: employeeSample,
};

const shortPermissionSample = {
  short_permission_id: 374,
  permission_type_id: 1,
  employee_id: 1001,
  from_date: '2026-06-10T09:00:00.000Z',
  to_date: '2026-06-10T10:00:00.000Z',
  from_time: '09:00:00',
  to_time: '10:00:00',
  perm_minutes: 60,
  remarks: 'Doctor appointment',
  approve_reject_flag: 0,
  employee_master_employee_short_permissions_employee_idToemployee_master:
    employeeSample,
};

const missingMovementSample = {
  emp_missing_Movements_Id: 501,
  Employee_Id: 1001,
  TransDate: '2026-06-10T00:00:00.000Z',
  Trans_IN: null,
  Reason_IN: 'IN',
  Status_IN: 'Missing',
  Trans_OUT: '2026-06-10T17:30:00.000Z',
  Reason_OUT: 'OUT',
  Status_OUT: 'Completed',
  Attendance_Status: 'Missing IN',
  employee_master: employeeSample,
};

const manualTransactionSample = {
  employee_manual_transaction_id: 2152,
  employee_id: 1001,
  transaction_time: '2026-06-10T09:00:00.000Z',
  emp_missing_movement_id: 501,
  reason: 'IN',
  remarks: 'Forgot to punch in',
  transaction_status: 'Pending',
  attachment_path: '/uploads/manual-transactions/proof.pdf',
  employee: employeeSample,
};

function paginatedExample(data: unknown[]) {
  return {
    success: true,
    data,
    total: data.length,
    hasNext: false,
  };
}

function simpleDataExample(data: unknown) {
  return {
    success: true,
    data,
  };
}

const simpleOperationExamples: Record<string, JsonExample> = {
  'Get today check-in and check-out for current mobile employee': {
    message: "Today's check-in/check-out fetched successfully",
    data: {
      checkIn: '2026-06-10T05:00:00.000Z',
      checkOut: '2026-06-10T13:30:00.000Z',
    },
  },
  'Get assigned work location for current mobile employee': {
    success: true,
    message: 'Work location details fetched successfully',
    data: {
      EmployeeNumber: 'E001',
      NameEng: 'John Doe',
      LocationCode: 'DXB-HQ',
      LocationEng: 'Dubai Head Office',
      City: 'Dubai',
      Geolocation: '25.2048,55.2708',
    },
  },
  'Get Spark today location for current employee': {
    message: 'Current location data for employee',
    data: {
      EmployeeNumber: 'E001',
      Radius: '5000000',
      Geolocation: '25.2048,55.2708',
    },
  },
  'Add employee leave request': {
    message: 'Employee leave application submitted successfully',
    data: leaveSample,
  },
  'Get all employee leave requests': paginatedExample([leaveSample]),
  'Get pending leave requests': paginatedExample([leaveSample]),
  'Get leave request by ID': simpleDataExample(leaveSample),
  'Get leave requests by employee ID': paginatedExample([leaveSample]),
  'Approve or reject leave request': {
    message: 'Employee leave approved successfully',
    employee_leave_id: 13362,
  },
  'Edit leave request': {
    message: 'Employee leave updated successfully',
    data: { ...leaveSample, employee_remarks: 'Updated leave request' },
  },
  'Delete multiple leave requests': {
    status: true,
    message: 'Employee leaves deleted successfully (2 deleted)',
  },
  'Delete leave request by ID': {
    message: 'Employee leave deleted successfully',
    employee_leave_id: 13362,
  },
  'Get logged-in user leave requests': paginatedExample([leaveSample]),
  'Get team leave requests': paginatedExample([leaveSample]),
  'Add short permission request': {
    message: 'Employee short permission application submitted successfully',
    data: shortPermissionSample,
  },
  'Get all short permission requests': paginatedExample([
    shortPermissionSample,
  ]),
  'Get pending short permissions': paginatedExample([shortPermissionSample]),
  'Get short permission by ID': simpleDataExample(shortPermissionSample),
  'Get short permissions by employee ID': paginatedExample([
    shortPermissionSample,
  ]),
  'Approve or reject short permission': {
    message: 'Employee short permission approved successfully',
    data: { ...shortPermissionSample, approve_reject_flag: 1 },
  },
  'Edit short permission': {
    message: 'Employee short permission updated successfully',
    data: { ...shortPermissionSample, remarks: 'Updated appointment reason' },
  },
  'Search short permission requests': paginatedExample([
    shortPermissionSample,
  ]),
  'Delete multiple short permissions': {
    status: true,
    message: 'Employee short permissions deleted successfully (2 deleted)',
  },
  'Delete short permission by ID': {
    message: 'Employee short permission deleted successfully',
    short_permission_id: 374,
  },
  'Get team short permission requests': paginatedExample([
    shortPermissionSample,
  ]),
  'Get all missing movements': paginatedExample([missingMovementSample]),
  'Get team missing movements': paginatedExample([missingMovementSample]),
  'Add manual movement transaction': {
    message: 'Transaction created successfully',
    data: manualTransactionSample,
  },
  'Get all manual movement transactions': paginatedExample([
    manualTransactionSample,
  ]),
  'Get manual movement transaction by ID': simpleDataExample(
    manualTransactionSample,
  ),
  'Edit manual movement transaction': {
    message: 'Transaction updated successfully',
    data: { ...manualTransactionSample, remarks: 'Updated manual punch reason' },
  },
  'Delete multiple manual movement transactions': {
    status: true,
    message: 'Transactions deleted successfully (2 deleted)',
  },
  'Delete manual movement transaction by ID': {
    message: 'Transaction deleted successfully',
    transaction_id: 2152,
  },
  'Get team manual movement transactions': paginatedExample([
    manualTransactionSample,
  ]),
  'Approve manual movement transaction': {
    message: 'Transaction approved successfully',
    data: { ...manualTransactionSample, transaction_status: 'Approved' },
  },
  'Reject manual movement transaction': {
    message: 'Transaction rejected successfully',
    data: { ...manualTransactionSample, transaction_status: 'Rejected' },
  },
  'Group approve manual transactions': {
    message: 'Group transaction approved successfully for 2 employees.',
    data: [
      { employee_id: 1001, transaction_status: 'Approved' },
      { employee_id: 1002, transaction_status: 'Approved' },
    ],
  },
  'Create group manual transactions by employee IDs': {
    message: 'Manual transactions created successfully for 2 entries.',
    data: [
      manualTransactionSample,
      { ...manualTransactionSample, employee_manual_transaction_id: 2153 },
    ],
  },
};

function getSimpleOperationExample(summary: string): JsonExample {
  return (
    simpleOperationExamples[summary] ?? {
      success: true,
      message: 'Request completed successfully',
      data: {},
    }
  );
}

export function ApiVerifyLocationOperation(summary: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiBody({ type: VerifyLocationDto }),
    apiJsonResponse(200, 'Location verified', {
      success: true,
      message:
        'Location verified successfully. You are within the allowed work location.',
    }),
    apiErrorResponse(
      400,
      'Invalid coordinates',
      'Invalid coordinates format. Expected an array of [latitude, longitude].',
    ),
    apiErrorResponse(
      403,
      'Not within allowed location',
      'You are not within the allowed work location.',
    ),
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
    apiJsonResponse(200, 'Verification successful', {
      success: true,
      message: 'Verification successful',
      subject: {
        transaction_id: 12345,
        employee_id: 1001,
        reason: 'IN',
        transaction_time: '2026-06-10T09:00:00.000Z',
        geolocation: '25.2048,55.2708',
        name_eng: 'John',
        name_arb: 'John Arabic',
      },
    }),
    apiErrorResponse(
      400,
      'Verification failed or invalid input',
      'Verification failed',
    ),
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
    apiJsonResponse(200, 'Verification successful', {
      success: true,
      message: 'Verification successful',
      subject: {
        transaction_id: 12345,
        employee_id: 1001,
        reason: 'OUT',
        transaction_time: '2026-06-10T17:30:00.000Z',
        geolocation: '25.2048,55.2708',
        name_eng: 'John',
        name_arb: 'John Arabic',
      },
    }),
    apiErrorResponse(
      400,
      'Verification failed or invalid input',
      'Verification failed',
    ),
  );
}

export function ApiSimpleSelfServiceReadOperation(summary: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    apiJsonResponse(
      200,
      'Request completed successfully',
      getSimpleOperationExample(summary),
    ),
    apiErrorResponse(400, 'Invalid request', 'Invalid input'),
    apiErrorResponse(401, 'Missing or invalid access token', 'Unauthorized'),
    apiErrorResponse(404, 'Resource not found', 'Resource not found'),
    apiErrorResponse(500, 'Unexpected backend error', 'Internal server error'),
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
    apiErrorResponse(
      400,
      'Invalid employee id in token context',
      'Invalid employee ID',
    ),
    apiErrorResponse(
      401,
      'Missing or invalid access token',
      'Unauthorized',
    ),
    apiErrorResponse(
      500,
      'Unexpected backend error',
      'Internal server error',
    ),
  );
}

export type SelfServiceMultipartDto = IdsPunchDto | IdsVerifyEncounterDto;
