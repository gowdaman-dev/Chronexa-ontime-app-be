import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeResponseDto } from './employee.dto';

export function ApiEmpNoProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'EMP001', description: 'Unique employee number', maxLength: 50, ...options }),
  );
}

export function ApiFirstnameEngProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'John', description: 'First name in English', maxLength: 800, ...options }),
  );
}

export function ApiLastnameEngProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'Doe', description: 'Last name in English', maxLength: 800, ...options }),
  );
}

export function ApiFirstnameArbProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'يوسف', description: 'First name in Arabic', maxLength: 800, ...options }),
  );
}

export function ApiLastnameArbProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'محمد', description: 'Last name in Arabic', maxLength: 800, ...options }),
  );
}

export function ApiCardNumberProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'CARD-001', description: 'Card number', maxLength: 100, ...options }),
  );
}

export function ApiPinProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: '1234', description: 'PIN code', maxLength: 100, ...options }),
  );
}

export function ApiOrganizationIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 1, description: 'Organization ID', ...options }),
  );
}

export function ApiGradeIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 3, description: 'Grade ID', ...options }),
  );
}

export function ApiDesignationIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 5, description: 'Designation/job title ID', ...options }),
  );
}

export function ApiCitizenshipIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 1, description: 'Citizenship/nationality ID', ...options }),
  );
}

export function ApiEmployeeTypeIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 2, description: 'Employee type ID', ...options }),
  );
}

export function ApiDepartmentIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 4, description: 'Department ID', ...options }),
  );
}

export function ApiDepartmentEngProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'Information Technology', description: 'Department name in English', ...options }),
  );
}

export function ApiDepartmentArbProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'تقنية المعلومات', description: 'Department name in Arabic', ...options }),
  );
}

export function ApiOrganizationEngProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'Aldar HQ', description: 'Organization name in English', ...options }),
  );
}

export function ApiOrganizationArbProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'الدار', description: 'Organization name in Arabic', ...options }),
  );
}

export function ApiVerticalIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 2, description: 'Parent vertical organization ID', ...options }),
  );
}

export function ApiVerticalEngProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'Real Estate', description: 'Vertical (parent organization) name in English', ...options }),
  );
}

export function ApiVerticalArbProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'العقارات', description: 'Vertical (parent organization) name in Arabic', ...options }),
  );
}

export function ApiDesignationEngProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'Software Engineer', description: 'Designation/job title in English', ...options }),
  );
}

export function ApiDesignationArbProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'مهندس برمجيات', description: 'Designation/job title in Arabic', ...options }),
  );
}

export function ApiCitizenshipEngProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'United Arab Emirates', description: 'Nationality/citizenship in English', ...options }),
  );
}

export function ApiCitizenshipArbProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'الإمارات العربية المتحدة', description: 'Nationality/citizenship in Arabic', ...options }),
  );
}

export function ApiNationalityEngProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'United Arab Emirates', description: 'Nationality name in English (alias of citizenshipEng)', ...options }),
  );
}

export function ApiNationalityArbProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'الإمارات العربية المتحدة', description: 'Nationality name in Arabic (alias of citizenshipArb)', ...options }),
  );
}

export function ApiManagerIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 10, description: 'Manager employee ID', ...options }),
  );
}

export function ApiLocationIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 2, description: 'Location ID', ...options }),
  );
}

export function ApiContractCompanyIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 1, description: 'Contract company ID', ...options }),
  );
}

export function ApiJoinDateProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: '2024-01-15', description: 'Employment join date', ...options }),
  );
}

export function ApiActiveDateProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: '2024-01-15', description: 'Activation date', ...options }),
  );
}

export function ApiInactiveDateProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: '2026-12-31', description: 'Deactivation date', ...options }),
  );
}

export function ApiNationalIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: '1234567890', description: 'National ID / Civil ID', maxLength: 100, ...options }),
  );
}

export function ApiNationalIdExpiryDateProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: '2030-01-01', description: 'National ID expiry date', ...options }),
  );
}

export function ApiPassportNumberProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'AB123456', description: 'Passport number', maxLength: 100, ...options }),
  );
}

export function ApiPassportExpiryDateProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: '2030-01-01', description: 'Passport expiry date', ...options }),
  );
}

export function ApiPassportIssueCountryIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 1, description: 'Passport issue country ID', ...options }),
  );
}

export function ApiMobileProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: '+971501234567', description: 'Mobile phone number', maxLength: 100, ...options }),
  );
}

export function ApiEmailProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'john@example.com', description: 'Work email address', maxLength: 100, ...options }),
  );
}

export function ApiPersonalEmailProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'john@gmail.com', description: 'Personal email address', ...options }),
  );
}

export function ApiGenderProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'Male', description: 'Gender', maxLength: 10, ...options }),
  );
}

export function ApiPhotoFileNameProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'photo_123.jpg', description: 'Profile photo file name', maxLength: 500, ...options }),
  );
}

export function ApiRemarksProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'Senior engineer, team lead', description: 'Additional remarks', maxLength: 900, ...options }),
  );
}

export function ApiEmployeeStatusProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'Active', description: 'Employee employment status', maxLength: 50, ...options }),
  );
}

export function ApiCostCenterProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'CC-IT-001', description: 'Cost center code', maxLength: 400, ...options }),
  );
}

export function ApiCostCodeProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 'IT-OPS', description: 'Cost code', maxLength: 50, ...options }),
  );
}

export function ApiActiveFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Active record flag', ...options }),
  );
}

export function ApiLocalFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: false, description: 'Local employee flag', ...options }),
  );
}

export function ApiPunchFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Punch attendance flag', ...options }),
  );
}

export function ApiManagerFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: false, description: 'Is manager flag', ...options }),
  );
}

export function ApiOnReportsFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Include in reports flag', ...options }),
  );
}

export function ApiIncludeEmailFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Include in email distribution flag', ...options }),
  );
}

export function ApiOpenShiftFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: false, description: 'Open shift flag', ...options }),
  );
}

export function ApiOvertimeFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Overtime eligible flag', ...options }),
  );
}

export function ApiWebPunchFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Web punch attendance flag', ...options }),
  );
}

export function ApiShiftFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Shift employee flag', ...options }),
  );
}

export function ApiSapUserFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: false, description: 'SAP user flag', ...options }),
  );
}

export function ApiLocalUserFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Local system user flag', ...options }),
  );
}

export function ApiInpayrollFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Included in payroll flag', ...options }),
  );
}

export function ApiShareRosterFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Share roster flag', ...options }),
  );
}

export function ApiGeofenceFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: false, description: 'Geofence tracking enabled flag', ...options }),
  );
}

export function ApiEmailNotificationsFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Receive email notifications flag', ...options }),
  );
}

export function ApiCheckInoutSelfieFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Require selfie for check in/out flag', ...options }),
  );
}

export function ApiCalculateMonthlyMissedHrsFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: true, description: 'Calculate monthly missed hours flag', ...options }),
  );
}

export function ApiExcludeFromIntegrationFlagProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: false, description: 'Exclude from external integration flag', ...options }),
  );
}

export function ApiEmployeeIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 100, description: 'Unique employee ID', ...options }),
  );
}

export function ApiCreatedIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 1, description: 'ID of user who created this record', ...options }),
  );
}

export function ApiLastUpdatedIdProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({ example: 1, description: 'ID of user who last updated this record', ...options }),
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

export function ApiCreateEmployeeBody() {
  return applyDecorators(
    ApiBody({ type: CreateEmployeeDto }),
  );
}

export function ApiUpdateEmployeeBody() {
  return applyDecorators(
    ApiBody({ type: UpdateEmployeeDto }),
  );
}

export function ApiCreateEmployeeOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Create a new employee record', description: 'Create a new employee with personal, organizational, and access details' }),
    ApiBody({ type: CreateEmployeeDto }),
    ApiResponse({ status: 201, description: 'Employee created successfully', type: EmployeeResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetAllEmployeesOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'List all employees', description: 'Retrieve a paginated list of all employee records' }),
    ApiResponse({
      status: 200,
      description: 'Paginated list of employees',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { $ref: '#/components/schemas/EmployeeResponseDto' } },
          total: { type: 'number', example: 100 },
          hasNext: { type: 'boolean', example: true },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetEmployeeByIdOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get employee by ID', description: 'Retrieve a single employee record by their unique ID' }),
    ApiParam({ name: 'id', type: Number, description: 'Employee ID', example: 100 }),
    ApiResponse({ status: 200, description: 'Employee details retrieved', type: EmployeeResponseDto }),
    ApiResponse({ status: 404, description: 'Employee not found' }),
  );
}

export function ApiUpdateEmployeeOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update employee record', description: 'Update an existing employee\'s personal, organizational, or access details' }),
    ApiParam({ name: 'id', type: Number, description: 'Employee ID', example: 100 }),
    ApiBody({ type: UpdateEmployeeDto }),
    ApiResponse({ status: 200, description: 'Employee updated successfully', type: EmployeeResponseDto }),
    ApiResponse({ status: 404, description: 'Employee not found' }),
  );
}

export function ApiDeleteEmployeeOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Delete employee record', description: 'Permanently delete an employee record' }),
    ApiParam({ name: 'id', type: Number, description: 'Employee ID', example: 100 }),
    ApiResponse({ status: 204, description: 'Employee deleted successfully' }),
    ApiResponse({ status: 404, description: 'Employee not found' }),
  );
}

function apiLookupListResponse(description: string) {
  return ApiResponse({
    status: 200,
    description,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'array', items: { type: 'object' } },
        total: { type: 'number', example: 10 },
        hasNext: { type: 'boolean', example: false },
      },
    },
  });
}

export function ApiGetDepartmentLookupsOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'List department lookups',
      description: 'Paginated department list for employee/report filters',
    }),
    apiLookupListResponse('Paginated department lookups'),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetDesignationLookupsOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'List designation lookups',
      description: 'Paginated designation list for employee/report filters',
    }),
    apiLookupListResponse('Paginated designation lookups'),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetOrganizationLookupsOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'List organization lookups',
      description: 'Paginated organization list for employee/report filters',
    }),
    apiLookupListResponse('Paginated organization lookups'),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetCitizenshipLookupsOperation() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'List citizenship lookups',
      description: 'Paginated citizenship/nationality list for employee/report filters',
    }),
    apiLookupListResponse('Paginated citizenship lookups'),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
