import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

function q(
  name: string,
  description: string,
  opts: { type?: 'string' | 'number' | 'boolean'; example?: unknown; required?: boolean } = {},
) {
  return ApiQuery({
    name,
    required: opts.required ?? false,
    type: opts.type ?? 'string',
    example: opts.example,
    description,
  });
}

/** limit + offset (offset is 1-based page number). */
export function ApiPaginationFilters() {
  return applyDecorators(
    q('limit', 'Records per page', { type: 'number', example: 10 }),
    q('offset', 'Page number (1-based)', { type: 'number', example: 1 }),
  );
}

export function ApiLeaveListFilters() {
  return applyDecorators(
    ApiPaginationFilters(),
    q('employee_id', 'Filter by employee ID', { type: 'number', example: 1001 }),
    q('leave_type_id', 'Filter by leave type ID', { type: 'number', example: 1 }),
    q('leave_status', 'Filter by approval status (0=pending, 1=approved, 2=rejected)', {
      type: 'number',
      example: 0,
    }),
    q('approve_reject_flag', 'Alias for leave_status', { type: 'number', example: 0 }),
    q('from_date', 'Leave period start (YYYY-MM-DD)', { example: '2025-01-01' }),
    q('to_date', 'Leave period end (YYYY-MM-DD)', { example: '2025-12-31' }),
    q('transaction_from_date', 'Created date range start', { example: '2025-01-01' }),
    q('transaction_to_date', 'Created date range end', { example: '2025-12-31' }),
    q('search', 'Search employee name or emp number', { example: 'john' }),
    q('employee_number', 'Filter by employee number', { example: 'E001' }),
    q('employee_name', 'Filter by employee name', { example: 'John' }),
    q('manager_id', 'Filter by manager employee ID', { type: 'number', example: 900 }),
    q('organization_id', 'Filter by organization ID', { type: 'number', example: 27 }),
    q('department_id', 'Filter by department ID', { type: 'number', example: 5 }),
    q('pending', 'Team view: pending only (team/all)', { example: 'true' }),
  );
}

export function ApiShortPermissionListFilters() {
  return applyDecorators(
    ApiPaginationFilters(),
    q('employee_id', 'Filter by employee ID', { type: 'number', example: 1001 }),
    q('status', 'Approval status (0=pending, 1=approved, 2=rejected)', { type: 'number', example: 0 }),
    q('approve_reject_flag', 'Alias for status', { type: 'number', example: 0 }),
    q('from_date', 'Permission overlap range start (YYYY-MM-DD)', { example: '2025-01-01' }),
    q('to_date', 'Permission overlap range end (YYYY-MM-DD)', { example: '2025-12-31' }),
    q('search', 'Search employee name or emp number', { example: 'john' }),
    q('employee_number', 'Filter by employee number', { example: 'E001' }),
    q('employee_name', 'Filter by employee name', { example: 'John' }),
    q('manager_id', 'Filter by manager employee ID', { type: 'number', example: 900 }),
  );
}

export function ApiMissingMovementFilters() {
  return applyDecorators(
    ApiPaginationFilters(),
    q('employee_id', 'Filter by employee ID', { type: 'number', example: 1001 }),
    q('employeeId', 'Alias for employee_id', { type: 'number', example: 1001 }),
    q('Employee_Id', 'Alias for employee_id (legacy)', { type: 'number', example: 1001 }),
    q('from_date', 'Transaction date range start', { example: '2025-01-01' }),
    q('to_date', 'Transaction date range end', { example: '2025-12-31' }),
    q('search', 'Search employee name or emp number', { example: 'john' }),
    q('department_id', 'Filter by department ID', { type: 'number', example: 5 }),
    q('organization_id', 'Filter by organization ID', { type: 'number', example: 27 }),
  );
}

export function ApiManualTransactionFilters() {
  return applyDecorators(
    ApiPaginationFilters(),
    q('employee_id', 'Filter by employee ID', { type: 'number', example: 1001 }),
    q('status', 'Transaction status: Pending | Approved | Rejected', { example: 'Pending' }),
    q('from_date', 'Transaction time range start', { example: '2025-01-01' }),
    q('to_date', 'Transaction time range end', { example: '2025-12-31' }),
  );
}

export function ApiEventTransactionFilters() {
  return applyDecorators(
    ApiPaginationFilters(),
    q('employee_id', 'Filter by employee ID', { type: 'number', example: 1001 }),
    q('employeeId', 'Alias for employee_id', { type: 'number', example: 1001 }),
    q('from_date', 'Transaction date range start', { example: '2025-01-01' }),
    q('to_date', 'Transaction date range end', { example: '2025-12-31' }),
    q('startDate', 'Alias for from_date', { example: '2025-01-01' }),
    q('endDate', 'Alias for to_date', { example: '2025-12-31' }),
    q('reason', 'Punch reason: IN or OUT', { example: 'IN' }),
    q('search', 'Search reason or remarks', { example: 'IN' }),
    q('organization_id', 'Filter by organization ID', { type: 'number', example: 27 }),
    q('department_id', 'Filter by department ID', { type: 'number', example: 5 }),
    q('manager_id', 'Filter by manager employee ID', { type: 'number', example: 900 }),
  );
}

export function ApiTodayStatusFilters() {
  return applyDecorators(
    q('employee_id', 'Employee ID (required)', { type: 'number', example: 1001, required: true }),
    q('employeeId', 'Alias for employee_id', { type: 'number', example: 1001 }),
    q('date', 'Work date (YYYY-MM-DD, default today)', { example: '2025-06-01' }),
  );
}

export function ApiLeaveTypeFilters() {
  return applyDecorators(
    ApiPaginationFilters(),
    q('search', 'Search leave type code or name', { example: 'annual' }),
    q('status_flag', 'Active/inactive filter', { example: 'true' }),
  );
}

export function ApiPermissionTypeFilters() {
  return applyDecorators(
    ApiPaginationFilters(),
    q('search', 'Search permission type code or name', { example: 'personal' }),
    q('name', 'Alias for search on name', { example: 'personal' }),
    q('code', 'Alias for search on code', { example: 'PERM' }),
    q('gender', 'Filter by specific gender (M/F)', { example: 'M' }),
    q('status_flag', 'Active/inactive filter', { example: 'true' }),
  );
}

export function ApiHolidayFilters() {
  return applyDecorators(
    ApiPaginationFilters(),
    q('search', 'Search holiday name', { example: 'national' }),
    q('name', 'Alias for search', { example: 'national' }),
    q('year', 'Filter by calendar year', { type: 'number', example: 2025 }),
    q('month', 'Filter by month (1-12)', { type: 'number', example: 1 }),
    q('from_date', 'Holiday date range start', { example: '2025-01-01' }),
    q('to_date', 'Holiday date range end', { example: '2025-12-31' }),
    q('recurring_flag', 'Recurring holidays only', { example: 'false' }),
    q('public_holiday_flag', 'Public holidays only', { example: 'true' }),
  );
}

export function ApiHolidayUpcomingFilters() {
  return applyDecorators(q('days', 'Number of days ahead', { type: 'number', example: 30 }));
}

export function ApiReportFilters() {
  return applyDecorators(
    ApiPaginationFilters(),
    q('from_date', 'Report start date (YYYY-MM-DD)', { example: '2025-01-01' }),
    q('to_date', 'Report end date (YYYY-MM-DD)', { example: '2025-06-30' }),
    q('date', 'Single work date (YYYY-MM-DD)', { example: '2025-06-01' }),
    q('employee_id', 'Scope to single employee ID', { type: 'number', example: 1001 }),
    q('employee_ids', 'Comma-separated employee IDs', { example: '1001,1002' }),
    q('employeeIds', 'Alias for employee_ids', { example: '1001,1002' }),
    q('organization_id', 'Filter by organization ID', { type: 'number', example: 27 }),
    q('organizationId', 'Alias for organization_id', { type: 'number', example: 27 }),
    q('department_id', 'Filter by department ID', { type: 'number', example: 5 }),
    q('departmentId', 'Alias for department_id', { type: 'number', example: 5 }),
    q('parent_orgid', 'Filter by parent organization ID', { type: 'number', example: 1 }),
    q('parentOrgId', 'Alias for parent_orgid', { type: 'number', example: 1 }),
    q('manager_id', 'Filter by manager employee ID', { type: 'number', example: 900 }),
    q('managerId', 'Alias for manager_id', { type: 'number', example: 900 }),
    q('employee_type_ids', 'Comma-separated employee type IDs', { example: '1,26' }),
    q('employeeTypeIds', 'Alias for employee_type_ids', { example: '1,26' }),
    q('isabsent', 'Absent filter: true | false', { example: 'false' }),
    q('costcode', 'Cost code filter', { example: 'CC01' }),
    q('costcenter', 'Cost center filter', { example: 'CENTER01' }),
    q('format', 'Response format: json | html | pdf', { example: 'json' }),
  );
}

export function ApiManualTransactionApproveQuery() {
  return applyDecorators(
    q('id', 'Manual transaction ID to approve', { type: 'number', example: 2152, required: true }),
  );
}

export function ApiManualTransactionRejectQuery() {
  return applyDecorators(
    q('id', 'Manual transaction ID to reject', { type: 'number', example: 2152, required: true }),
  );
}
