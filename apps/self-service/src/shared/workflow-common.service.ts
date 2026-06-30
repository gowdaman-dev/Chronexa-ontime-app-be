import { Injectable } from '@nestjs/common';
import { AppLoggerService, microserviceFail } from '@app/common';

@Injectable()
export class WorkflowCommonService {
  constructor(private readonly logger: AppLoggerService) {}

  fail(statusCode: number, message: string, extra?: Record<string, any>): never {
    microserviceFail(
      this.logger,
      statusCode,
      message,
      extra,
      statusCode >= 500
        ? 'Self-service workflow error'
        : 'Self-service workflow request rejected',
    );
  }

  toNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  toBoolean(value: any): boolean | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true' || value === '1';
    return Boolean(value);
  }

  parsePagination(query: Record<string, any> = {}) {
    const limit = Math.max(1, this.toNumber(query.limit) ?? 10);
    const offset = Math.max(1, this.toNumber(query.offset) ?? 1);
    return { limit, offset, skip: (offset - 1) * limit, take: limit };
  }

  /** Reports/attendance: omit limit (or limit=0 / limit=all) to fetch every matching row. */
  parseReportPagination(query: Record<string, any> = {}) {
    const raw = query.limit;
    const unlimited =
      raw === undefined ||
      raw === null ||
      raw === '' ||
      String(raw).toLowerCase() === 'all' ||
      this.toNumber(raw) === 0;
    if (unlimited) {
      return { unlimited: true as const, offset: 1, skip: 0, take: 0 };
    }
    const { limit, offset, skip, take } = this.parsePagination(query);
    return { unlimited: false as const, limit, offset, skip, take };
  }

  parseDate(value: any): Date | undefined {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  parseDateRange(start?: string, end?: string) {
    const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
    const startDate = start
      ? this.parseDate(isDateOnly(start) ? `${start}T00:00:00` : start)
      : undefined;
    const endDate = end
      ? this.parseDate(isDateOnly(end) ? `${end}T23:59:59.999` : end)
      : undefined;
    return { startDate, endDate };
  }

  dateFilter(start?: string, end?: string) {
    const { startDate, endDate } = this.parseDateRange(start, end);
    if (startDate && endDate) return { gte: startDate, lte: endDate };
    if (startDate) return { gte: startDate };
    if (endDate) return { lte: endDate };
    return undefined;
  }

  isAdminRole(user: any) {
    return String(user?.role ?? '').toLowerCase().includes('admin');
  }

  /** Pass-through — org RBAC is handled outside self-service filters. */
  applyEmployeeOrgScope(
    where: Record<string, any>,
    _relationKey?: string,
    _user?: { role?: string },
    _allowedOrgIds?: number[],
  ) {
    return where;
  }

  mergeWhere(
    base: Record<string, any> = {},
    extra: Record<string, any> = {},
  ) {
    if (!Object.keys(extra).length) return base;
    if (!Object.keys(base).length) return extra;
    return { AND: [base, extra] };
  }

  /** Old GET /employeeLeave/all leave-period overlap filter. */
  buildLeaveAllDateFilter(fromDate?: string, toDate?: string) {
    const { startDate: parsedFrom, endDate: parsedTo } = this.parseDateRange(
      fromDate,
      toDate,
    );
    if (parsedFrom && parsedTo) {
      return {
        AND: [
          {
            OR: [
              { from_date: { gte: parsedFrom } },
              { to_date: { gte: parsedFrom } },
            ],
          },
          {
            OR: [
              { from_date: { lte: parsedTo } },
              { to_date: { lte: parsedTo } },
            ],
          },
        ],
      };
    }
    if (parsedFrom) {
      return {
        OR: [
          { from_date: { gte: parsedFrom } },
          { to_date: { gte: parsedFrom } },
        ],
      };
    }
    if (parsedTo) {
      return {
        OR: [
          { from_date: { lte: parsedTo } },
          { to_date: { lte: parsedTo } },
        ],
      };
    }
    return {};
  }

  /** Old GET /employeeLeave/team/all overlap filter. */
  buildLeaveTeamDateFilter(fromDate?: string, toDate?: string) {
    const filter: Record<string, any> = {};
    if (fromDate) filter.to_date = { gte: new Date(String(fromDate)) };
    if (toDate) filter.from_date = { lte: new Date(String(toDate)) };
    return filter;
  }

  /** Old GET /employeeLeave/get/:id (employee list) date containment filter. */
  buildLeaveEmployeeGetDateFilter(fromDate?: string, toDate?: string) {
    const { startDate: parsedFrom, endDate: parsedTo } = this.parseDateRange(
      fromDate,
      toDate,
    );
    const filter: Record<string, any> = {};
    if (parsedFrom && parsedTo) {
      filter.from_date = { gte: parsedFrom };
      filter.to_date = { lte: parsedTo };
    } else if (parsedFrom) {
      filter.from_date = { gte: parsedFrom };
    } else if (parsedTo) {
      filter.to_date = { lte: parsedTo };
    }
    return filter;
  }

  compact<T extends Record<string, any>>(value: T): T {
    return Object.fromEntries(
      Object.entries(value).filter(([, item]) => item !== undefined),
    ) as T;
  }

  uploadPath(file: any, prefix = '/uploads') {
    const filename = file?.filename ?? file?.originalname;
    return filename ? `${prefix}/${filename}` : undefined;
  }

  parseNumberArray(value: any): number[] {
    if (Array.isArray(value)) {
      return value.map((item) => Number(item)).filter(Number.isFinite);
    }
    if (typeof value === 'number' && Number.isFinite(value)) return [value];
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        return this.parseNumberArray(parsed);
      } catch {
        return value
          .split(',')
          .map((item) => Number(item.trim()))
          .filter(Number.isFinite);
      }
    }
    return [];
  }

  resolveEmployeeId(query: Record<string, any> = {}) {
    return (
      this.toNumber(query.employeeId) ??
      this.toNumber(query.employee_id) ??
      this.toNumber(query.Employee_Id)
    );
  }

  isManagerRole(user: any) {
    const role = String(user?.role ?? '').toLowerCase();
    return role.includes('manager') || role.includes('admin');
  }
}
