import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
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
  employee_master: employeeSample,
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
  employee_master: employeeSample,
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
  'List all leave types': paginatedExample([
    { leave_type_id: 1, leave_type_code: 'AL', leave_type_eng: 'Annual Leave', status_flag: true },
  ]),
  'List active leave types': paginatedExample([
    { leave_type_id: 1, leave_type_code: 'AL', leave_type_eng: 'Annual Leave', status_flag: true },
  ]),
  'Leave type dropdown list': paginatedExample([
    { leave_type_id: 1, leave_type_eng: 'Annual Leave' },
  ]),
  'Get leave type by ID': simpleDataExample({
    leave_type_id: 1,
    leave_type_code: 'AL',
    leave_type_eng: 'Annual Leave',
  }),
  'Create leave type': { message: 'Leave type created successfully', data: { leave_type_id: 1 } },
  'Update leave type': { message: 'Leave type updated successfully', data: { leave_type_id: 1 } },
  'Delete leave type by ID': { message: 'Leave type deleted successfully', leave_type_id: 1 },
  'Bulk delete leave types': { status: true, message: 'Leave types deleted successfully (2 deleted)' },
  'List all permission types': paginatedExample([
    { permission_type_id: 1, permission_type_code: 'PERM', permission_type_eng: 'Personal' },
  ]),
  'List active permission types': paginatedExample([
    { permission_type_id: 1, permission_type_eng: 'Personal', status_flag: true },
  ]),
  'Permission types by gender': paginatedExample([
    { permission_type_id: 1, specific_gender: 'M' },
  ]),
  'Search permission types': paginatedExample([
    { permission_type_id: 1, permission_type_eng: 'Personal' },
  ]),
  'Get permission type by ID': simpleDataExample({ permission_type_id: 1 }),
  'Create permission type': { message: 'Permission type created successfully', data: { permission_type_id: 1 } },
  'Update permission type': { message: 'Permission type updated successfully', data: { permission_type_id: 1 } },
  'Delete permission type by ID': { message: 'Permission type deleted successfully', permission_type_id: 1 },
  'Bulk delete permission types': {
    status: true,
    message: 'Permission types deleted successfully (2 deleted)',
  },
  'List all holidays': paginatedExample([
    { holiday_id: 1, holiday_eng: 'National Day', from_date: '2025-12-02', to_date: '2025-12-02' },
  ]),
  'Upcoming holidays': paginatedExample([
    { holiday_id: 1, holiday_eng: 'National Day', from_date: '2025-12-02' },
  ]),
  'Search holidays': paginatedExample([{ holiday_id: 1, holiday_eng: 'National Day' }]),
  'Get holiday by ID': simpleDataExample({ holiday_id: 1, holiday_eng: 'National Day' }),
  'Create holiday': { message: 'Holiday created successfully', data: { holiday_id: 1 } },
  'Update holiday': { message: 'Holiday updated successfully', data: { holiday_id: 1 } },
  'Delete holiday by ID': { message: 'Holiday deleted successfully', holiday_id: 1 },
  'Bulk delete holidays': { status: true, message: 'Holidays deleted successfully (2 deleted)' },
  'Create employee event transaction': {
    message: 'Employee event transaction created successfully',
    data: { transaction_id: 12345, reason: 'IN' },
  },
  'Create event transaction by employee number (subject_id)': {
    message: 'Employee event transaction created successfully',
    data: { transaction_id: 12346, reason: 'OUT' },
  },
  'List all event transactions': paginatedExample([
    { transaction_id: 12345, employee_id: 1001, reason: 'IN' },
  ]),
  'Get event transaction by ID': simpleDataExample({ transaction_id: 12345, reason: 'IN' }),
  'Event transactions by employee': paginatedExample([{ transaction_id: 12345 }]),
  'Team event transactions': paginatedExample([{ transaction_id: 12345 }]),
  'Update event transaction': { message: 'Employee event transaction updated successfully' },
  'Delete event transaction by ID': { message: 'Transaction deleted successfully', transaction_id: 12345 },
  'Bulk delete event transactions': { status: true, message: 'Transactions deleted successfully (2 deleted)' },
  'My last event transaction': simpleDataExample({ transaction_id: 12345, reason: 'IN' }),
  'Last event transaction by employee': simpleDataExample({ transaction_id: 12345 }),
  'Current punch status': simpleDataExample({ status: 'IN', last_transaction: '2026-06-10T09:00:00.000Z' }),
  'Today schedule and holiday status': simpleDataExample({
    employee_id: 1001,
    date: '2026-06-10',
    schedule_id: 5,
    holidays: [],
  }),
  'Daily attendance report from sp_employee_daily_report': paginatedExample([
    { EmployeeID: 1001, WorkDate: '2026-06-10', PunchIn: '09:00', PunchOut: '17:30' },
  ]),
  'Daily report (JSON or HTML/PDF)': paginatedExample([{ EmployeeID: 1001, WorkDate: '2026-06-10' }]),
  'Weekly report (JSON or HTML/PDF)': paginatedExample([{ EmployeeID: 1001, WorkDate: '2026-06-10' }]),
  'Monthly report (JSON or HTML/PDF)': paginatedExample([{ EmployeeID: 1001, WorkDate: '2026-06-10' }]),
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
  return ApiSelfServiceOperation(summary);
}

/** Self-service operation with optional Swagger extras (filters, params, body). */
export function ApiSelfServiceOperation(summary: string, ...extras: MethodDecorator[]) {
  return applyDecorators(
    ApiOperation({ summary }),
    ...extras,
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

export function ApiSelfServiceIdParam(name = 'id', description = 'Record ID') {
  return applyDecorators(ApiParam({ name, type: Number, example: 1, description }));
}

export function ApiSelfServiceEmployeeIdParam() {
  return applyDecorators(
    ApiParam({ name: 'employeeId', type: Number, example: 1001, description: 'Employee ID' }),
  );
}

export function ApiSelfServiceGenderParam() {
  return applyDecorators(
    ApiParam({ name: 'gender', type: String, example: 'M', description: 'Gender code: M or F' }),
  );
}

export function ApiBulkDeleteBody(entityName: string) {
  return applyDecorators(
    ApiBody({
      schema: {
        type: 'object',
        required: ['ids'],
        properties: {
          ids: {
            type: 'array',
            items: { type: 'number' },
            example: [1, 2],
            description: `${entityName} IDs to delete`,
          },
        },
      },
    }),
  );
}

export function ApiApproveRejectBody() {
  return applyDecorators(
    ApiBody({
      schema: {
        type: 'object',
        required: ['approve_reject_flag'],
        properties: {
          approve_reject_flag: {
            type: 'number',
            example: 1,
            description: '1=approve, 2=reject',
          },
          approver_remarks: { type: 'string', example: 'Approved' },
        },
      },
    }),
  );
}

export function ApiGroupApproveTransactionsBody() {
  return applyDecorators(
    ApiBody({
      schema: {
        type: 'object',
        required: ['transaction_time', 'reason'],
        properties: {
          transaction_time: { type: 'string', example: '2026-06-10T08:00:00' },
          reason: { type: 'string', example: 'IN' },
          employee_ids: { type: 'array', items: { type: 'number' }, example: [1001, 1002] },
          remarks: { type: 'string', example: 'Group punch' },
        },
      },
    }),
  );
}

export function ApiGroupApproveByEmployeeIdsBody() {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['employee_ids', 'reason', 'transaction_time', 'attachment'],
        properties: {
          employee_ids: { type: 'string', example: '1001,1002' },
          reason: { type: 'string', example: 'IN' },
          transaction_time: { type: 'string', example: '2026-06-10T08:00:00' },
          remarks: { type: 'string', example: 'Group manual entry' },
          attachment: { type: 'string', format: 'binary' },
        },
      },
    }),
  );
}

export function ApiAddLeaveBody() {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['leave_type_id', 'from_date', 'to_date'],
        properties: {
          leave_type_id: { type: 'number', example: 1 },
          from_date: { type: 'string', example: '2026-06-10' },
          to_date: { type: 'string', example: '2026-06-11' },
          number_of_leaves: { type: 'number', example: 2 },
          employee_remarks: { type: 'string', example: 'Annual leave' },
          leave_doc: { type: 'string', format: 'binary' },
        },
      },
    }),
  );
}

export function ApiAddShortPermissionBody() {
  return applyDecorators(
    ApiBody({
      schema: {
        type: 'object',
        required: ['permission_type_id', 'from_date', 'to_date', 'remarks'],
        properties: {
          permission_type_id: { type: 'number', example: 1 },
          from_date: { type: 'string', example: '2026-06-10' },
          to_date: { type: 'string', example: '2026-06-10' },
          from_time: { type: 'string', example: '09:00' },
          to_time: { type: 'string', example: '10:00' },
          remarks: { type: 'string', example: 'Doctor appointment' },
        },
      },
    }),
  );
}

export function ApiAddManualTransactionBody() {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['employee_id', 'reason', 'transaction_time', 'remarks', 'attachment'],
        properties: {
          employee_id: { type: 'number', example: 1001 },
          reason: { type: 'string', example: 'IN' },
          transaction_time: { type: 'string', example: '2026-06-10T08:00:00' },
          remarks: { type: 'string', example: 'Forgot to punch' },
          emp_missing_movement_id: { type: 'number', example: 501 },
          attachment: { type: 'string', format: 'binary' },
        },
      },
    }),
  );
}

export function ApiAddEventTransactionBody() {
  return applyDecorators(
    ApiBody({
      schema: {
        type: 'object',
        required: ['employee_id', 'reason', 'transaction_time'],
        properties: {
          employee_id: { type: 'number', example: 1001 },
          reason: { type: 'string', example: 'IN' },
          transaction_time: { type: 'string', example: '2026-06-10T08:00:00' },
          remarks: { type: 'string', example: 'Manual entry' },
        },
      },
    }),
  );
}

export function ApiAddEventTransactionSubjectBody() {
  return applyDecorators(
    ApiBody({
      schema: {
        type: 'object',
        required: ['subject_id', 'reason', 'transaction_time'],
        properties: {
          subject_id: { type: 'string', example: 'E001', description: 'Employee number (emp_no)' },
          reason: { type: 'string', example: 'OUT' },
          transaction_time: { type: 'string', example: '2026-06-10T17:30:00' },
          remarks: { type: 'string', example: 'Manual OUT' },
        },
      },
    }),
  );
}

export function ApiVerifyEventTransactionBody() {
  return applyDecorators(
    ApiBody({
      schema: {
        type: 'object',
        required: ['employee_id', 'reason', 'time_stamp', 'coordinates'],
        properties: {
          employee_id: { type: 'number', example: 1001 },
          reason: { type: 'string', enum: ['IN', 'OUT'], example: 'IN' },
          time_stamp: {
            type: 'string',
            example: '2026-06-10T08:00:00',
            description: 'ISO 8601 date-time',
          },
          coordinates: {
            type: 'array',
            items: { type: 'number' },
            minItems: 2,
            maxItems: 2,
            example: [25.2048, 55.2708],
            description: '[latitude, longitude]',
          },
        },
      },
    }),
  );
}

export function ApiLeaveTypeBody() {
  return applyDecorators(
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          leave_type_code: { type: 'string', example: 'AL' },
          leave_type_eng: { type: 'string', example: 'Annual Leave' },
          leave_type_arb: { type: 'string', example: 'Annual Leave AR' },
          status_flag: { type: 'boolean', example: true },
          need_approval_flag: { type: 'boolean', example: true },
        },
      },
    }),
  );
}

export function ApiPermissionTypeBody() {
  return applyDecorators(
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          permission_type_code: { type: 'string', example: 'PERM' },
          permission_type_eng: { type: 'string', example: 'Personal Permission' },
          permission_type_arb: { type: 'string', example: 'Personal AR' },
          status_flag: { type: 'boolean', example: true },
          max_perm_per_day: { type: 'number', example: 1 },
          max_minutes_per_day: { type: 'number', example: 60 },
        },
      },
    }),
  );
}

export function ApiHolidayBody() {
  return applyDecorators(
    ApiBody({
      schema: {
        type: 'object',
        required: ['holiday_eng', 'from_date', 'to_date'],
        properties: {
          holiday_eng: { type: 'string', example: 'National Day' },
          holiday_arb: { type: 'string', example: 'National Day AR' },
          from_date: { type: 'string', example: '2025-12-02' },
          to_date: { type: 'string', example: '2025-12-02' },
          recurring_flag: { type: 'boolean', example: false },
          public_holiday_flag: { type: 'boolean', example: true },
          remarks: { type: 'string', example: 'Public holiday' },
        },
      },
    }),
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
