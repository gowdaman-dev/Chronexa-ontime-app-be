import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AppLoggerService } from '@app/common';

@Injectable()
export class WorkflowCommonService {
  constructor(private readonly logger: AppLoggerService) {}

  fail(statusCode: number, message: string, extra?: Record<string, any>): never {
    const meta = { statusCode, ...extra };
    if (statusCode >= 500) {
      this.logger.error('Self-service workflow error', { message, ...meta });
    } else {
      this.logger.warn('Self-service workflow request rejected', {
        message,
        ...meta,
      });
    }
    throw new RpcException({ statusCode, message, ...extra });
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
