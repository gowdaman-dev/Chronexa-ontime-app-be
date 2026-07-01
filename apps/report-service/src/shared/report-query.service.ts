import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@app/prisma';
import { ReportCommonService } from './report-common.service';

export type ReportRoleScope = {
  employeeId?: number;
  managerId?: number;
};

@Injectable()
export class ReportQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly common: ReportCommonService,
  ) {}

  private isAbsentFlag(value: unknown) {
    return value === true || value === 'true' || value === '1';
  }

  private buildIsAbsentConditionSql(value: unknown): Prisma.Sql {
    if (this.isAbsentFlag(value)) {
      return Prisma.sql`IsAbsent IN ('Absent', 'WeekOff')`;
    }
    return Prisma.sql`(IsAbsent IS NULL OR IsAbsent = '' OR IsAbsent NOT IN ('Absent', 'WeekOff'))`;
  }

  private buildIsAbsentCondition(value: unknown): string {
    if (this.isAbsentFlag(value)) {
      return `IsAbsent IN ('Absent', 'WeekOff')`;
    }
    return `(IsAbsent IS NULL OR IsAbsent = '' OR IsAbsent NOT IN ('Absent', 'WeekOff'))`;
  }

  private resolveQueryString(query: Record<string, any>, ...keys: string[]) {
    for (const key of keys) {
      const value = query[key];
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    }
    return undefined;
  }

  buildSpWhere(query: Record<string, any> = {}, scope?: ReportRoleScope) {
    query = this.normalizeReportQuery(query);
    const conditions: string[] = [`EmployeeStatus='Active'`];

    if (query.from_date) {
      const fromDate = String(query.from_date).slice(0, 10);
      conditions.push(`CAST(WorkDate AS DATE) >= CAST('${fromDate}' AS DATE)`);
    }
    if (query.to_date) {
      const toDate = String(query.to_date).slice(0, 10);
      conditions.push(`CAST(WorkDate AS DATE) <= CAST('${toDate}' AS DATE)`);
    }
    if (query.date && !this.hasReportDateRange(query)) {
      const date = String(query.date).slice(0, 10);
      conditions.push(`CAST(WorkDate AS DATE) = CAST('${date}' AS DATE)`);
    }

    const employeeIds = this.common.parseNumberArray(
      query.employee_ids ?? query.employeeIds,
    );
    const scopedEmployeeId =
      scope?.employeeId ?? this.common.resolveEmployeeId(query);
    if (scopedEmployeeId) {
      conditions.push(`EmployeeID = ${scopedEmployeeId}`);
    } else if (employeeIds.length) {
      conditions.push(`EmployeeID IN (${employeeIds.join(',')})`);
    }

    const organizationId = this.common.toNumber(
      query.organization_id ?? query.organizationId,
    );
    if (organizationId) conditions.push(`OrganizationID = ${organizationId}`);

    const departmentId = this.common.toNumber(
      query.department_id ?? query.departmentId,
    );
    if (departmentId) conditions.push(`DepartmentID = ${departmentId}`);

    const parentOrgId = this.common.toNumber(
      query.parent_orgid ?? query.parentOrgId,
    );
    if (parentOrgId) conditions.push(`ParentOrgID = ${parentOrgId}`);

    const managerId =
      scope?.managerId ?? this.common.toNumber(query.manager_id ?? query.managerId);
    if (managerId) conditions.push(`ManagerID = ${managerId}`);

    const employeeTypeIds = this.common.parseNumberArray(
      query.employee_type_ids ?? query.employeeTypeIds,
    );
    if (employeeTypeIds.length) {
      conditions.push(`EmployeeTypeID IN (${employeeTypeIds.join(',')})`);
    }

    if (query.isabsent !== undefined) {
      conditions.push(this.buildIsAbsentCondition(query.isabsent));
    }

    const costCode = this.resolveQueryString(query, 'costcode', 'cost_code', 'costCode');
    if (costCode) conditions.push(`CostCode = '${costCode}'`);

    const costCenter = this.resolveQueryString(
      query,
      'costcenter',
      'cost_center',
      'costCenter',
    );
    if (costCenter) conditions.push(`CostCenter = '${costCenter}'`);

    return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  private buildSpWhereSql(
    query: Record<string, any> = {},
    scope?: ReportRoleScope,
  ): Prisma.Sql {
    query = this.normalizeReportQuery(query);
    const conditions: Prisma.Sql[] = [Prisma.sql`EmployeeStatus='Active'`];

    if (query.from_date) {
      const fromDate = String(query.from_date).slice(0, 10);
      conditions.push(
        Prisma.sql`CAST(WorkDate AS DATE) >= CAST(${fromDate} AS DATE)`,
      );
    }
    if (query.to_date) {
      const toDate = String(query.to_date).slice(0, 10);
      conditions.push(
        Prisma.sql`CAST(WorkDate AS DATE) <= CAST(${toDate} AS DATE)`,
      );
    }
    if (query.date && !this.hasReportDateRange(query)) {
      const date = String(query.date).slice(0, 10);
      conditions.push(Prisma.sql`CAST(WorkDate AS DATE) = CAST(${date} AS DATE)`);
    }

    const employeeIds = this.common.parseNumberArray(
      query.employee_ids ?? query.employeeIds,
    );
    const scopedEmployeeId =
      scope?.employeeId ?? this.common.resolveEmployeeId(query);
    if (scopedEmployeeId) {
      conditions.push(Prisma.sql`EmployeeID = ${scopedEmployeeId}`);
    } else if (employeeIds.length) {
      conditions.push(
        Prisma.sql`EmployeeID IN (${Prisma.join(employeeIds)})`,
      );
    }

    const organizationId = this.common.toNumber(
      query.organization_id ?? query.organizationId,
    );
    if (organizationId) {
      conditions.push(Prisma.sql`OrganizationID = ${organizationId}`);
    }

    const departmentId = this.common.toNumber(
      query.department_id ?? query.departmentId,
    );
    if (departmentId) {
      conditions.push(Prisma.sql`DepartmentID = ${departmentId}`);
    }

    const parentOrgId = this.common.toNumber(
      query.parent_orgid ?? query.parentOrgId,
    );
    if (parentOrgId) {
      conditions.push(Prisma.sql`ParentOrgID = ${parentOrgId}`);
    }

    const managerId =
      scope?.managerId ?? this.common.toNumber(query.manager_id ?? query.managerId);
    if (managerId) {
      conditions.push(Prisma.sql`ManagerID = ${managerId}`);
    }

    const employeeTypeIds = this.common.parseNumberArray(
      query.employee_type_ids ?? query.employeeTypeIds,
    );
    if (employeeTypeIds.length) {
      conditions.push(
        Prisma.sql`EmployeeTypeID IN (${Prisma.join(employeeTypeIds)})`,
      );
    }

    if (query.isabsent !== undefined) {
      conditions.push(this.buildIsAbsentConditionSql(query.isabsent));
    }

    const costCode = this.resolveQueryString(query, 'costcode', 'cost_code', 'costCode');
    if (costCode) {
      conditions.push(Prisma.sql`CostCode = ${costCode}`);
    }

    const costCenter = this.resolveQueryString(
      query,
      'costcenter',
      'cost_center',
      'costCenter',
    );
    if (costCenter) {
      conditions.push(Prisma.sql`CostCenter = ${costCenter}`);
    }

    return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
  }

  private shouldInterleaveDaysByEmployee(query: Record<string, any>, scope?: ReportRoleScope) {
    if (!this.hasReportDateRange(query)) return false;
    const pagination = this.common.parseReportPagination(query);
    if (pagination.unlimited) return false;
    const scopedEmployeeId =
      scope?.employeeId ?? this.common.resolveEmployeeId(query);
    if (scopedEmployeeId) return false;
    const employeeIds = this.common.parseNumberArray(
      query.employee_ids ?? query.employeeIds,
    );
    if (employeeIds.length === 1) return false;
    return true;
  }

  async querySpEmployeeDailyReport(
    query: Record<string, any> = {},
    scope?: ReportRoleScope,
  ) {
    query = this.normalizeReportQuery(query);
    const whereClause = this.buildSpWhereSql(query, scope);
    const pagination = this.common.parseReportPagination(query);
    const pagingSql = pagination.unlimited
      ? Prisma.empty
      : Prisma.sql` OFFSET ${pagination.skip} ROWS FETCH NEXT ${pagination.take} ROWS ONLY`;
    const interleave = this.shouldInterleaveDaysByEmployee(query, scope);
    const dataQuery = interleave
      ? Prisma.sql`
          SELECT * FROM (
            SELECT
              src.*,
              ROW_NUMBER() OVER (
                PARTITION BY CAST(src.WorkDate AS DATE)
                ORDER BY src.EmployeeID ASC
              ) AS __day_rn
            FROM [dbo].[sp_employee_daily_report] src
            ${whereClause}
          ) ranked
          ORDER BY ranked.__day_rn ASC, ranked.WorkDate DESC, ranked.EmployeeID ASC
          ${pagingSql}
        `
      : Prisma.sql`
          SELECT * FROM [dbo].[sp_employee_daily_report]
          ${whereClause}
          ORDER BY WorkDate DESC, EmployeeID ASC
          ${pagingSql}
        `;
    const countQuery = Prisma.sql`
      SELECT COUNT(*) as cnt FROM [dbo].[sp_employee_daily_report]
      ${whereClause}
    `;
    const [rawData, countResult] = await Promise.all([
      this.prisma.$queryRaw<any[]>(dataQuery),
      this.prisma.$queryRaw<any[]>(countQuery),
    ]);
    const data = interleave
      ? rawData.map(({ __day_rn, ...row }) => row)
      : rawData;
    const total = countResult?.[0]
      ? Number(countResult[0].cnt ?? countResult[0].COUNT ?? 0)
      : 0;
    const hasNext = pagination.unlimited
      ? false
      : pagination.skip + data.length < total;
    return { data: this.formatReportRows(data), total, hasNext };
  }

  /** Format SQL date/datetime values as YYYY-MM-DD for API/HTML/PDF output. */
  formatReportDateValue(value: unknown) {
    if (value === null || value === undefined || value === '') return value;
    if (value instanceof Date) {
      const year = value.getUTCFullYear();
      const month = String(value.getUTCMonth() + 1).padStart(2, '0');
      const day = String(value.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const text = String(value);
    const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDate) return isoDate[1];
    return value;
  }

  formatReportRows(rows: any[] = []) {
    const dateFields = ['WorkDate', 'SnapshotDate'];
    return rows.map((row) => {
      const formatted = { ...row };
      for (const field of dateFields) {
        if (field in formatted) {
          formatted[field] = this.formatReportDateValue(formatted[field]);
        }
      }
      return formatted;
    });
  }

  private sliceDate(value: unknown) {
    return value ? String(value).slice(0, 10) : undefined;
  }

  /** Parse YYYY-MM-DD without UTC timezone shift (avoids off-by-one on servers west of UTC). */
  private parseDateOnly(value: unknown): Date | undefined {
    const text = this.sliceDate(value);
    if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return undefined;
    const [year, month, day] = text.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Normalize report query params: aliases, ISO date strings, and drop exact `date`
   * when a range (from_date/to_date) is present so SQL does not over-restrict rows.
   */
  normalizeReportQuery(query: Record<string, any> = {}) {
    const normalized = { ...query };
    const from =
      this.sliceDate(
        normalized.from_date ?? normalized.fromDate ?? normalized.startDate,
      );
    const to = this.sliceDate(
      normalized.to_date ?? normalized.toDate ?? normalized.endDate,
    );
    if (from) normalized.from_date = from;
    else delete normalized.from_date;
    if (to) normalized.to_date = to;
    else delete normalized.to_date;
    delete normalized.fromDate;
    delete normalized.toDate;
    delete normalized.startDate;
    delete normalized.endDate;
    if (from || to) {
      delete normalized.date;
    } else if (normalized.date) {
      normalized.date = this.sliceDate(normalized.date);
    }
    return normalized;
  }

  hasReportDateRange(query: Record<string, any> = {}) {
    return Boolean(query.from_date || query.to_date);
  }

  resolveReportDateFilters(query: Record<string, any> = {}) {
    query = this.normalizeReportQuery(query);
    const range: { from_date?: string; to_date?: string; date?: string } = {};
    if (query.from_date) range.from_date = this.sliceDate(query.from_date);
    if (query.to_date) range.to_date = this.sliceDate(query.to_date);
    if (query.date) range.date = this.sliceDate(query.date);
    return range;
  }

  reportDateMeta(
    query: Record<string, any> = {},
    merged: Record<string, any> = {},
  ) {
    const from_date =
      merged.from_date ??
      this.sliceDate(query.from_date) ??
      (query.date && !query.from_date ? this.sliceDate(query.date) : undefined);
    const to_date =
      merged.to_date ??
      this.sliceDate(query.to_date) ??
      (query.date && !query.to_date ? this.sliceDate(query.date) : undefined);
    return {
      ...(from_date ? { from_date } : {}),
      ...(to_date ? { to_date } : {}),
    };
  }

  private formatLocalDate(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  resolveDateRange(
    period: 'daily' | 'weekly' | 'monthly',
    query: Record<string, any> = {},
  ) {
    query = this.normalizeReportQuery(query);
    if (query.from_date || query.to_date) {
      return this.resolveReportDateFilters(query);
    }
    if (!query.date) {
      return {};
    }

    const anchor = this.parseDateOnly(query.date);
    if (!anchor) {
      return {};
    }
    const start = new Date(anchor);
    const end = new Date(anchor);

    if (period === 'weekly') {
      start.setDate(start.getDate() - 6);
    } else if (period === 'monthly') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    }

    return {
      from_date: this.formatLocalDate(start),
      to_date: this.formatLocalDate(end),
    };
  }

  buildReportHtml(title: string, rows: any[], meta?: { from_date?: string; to_date?: string; total?: number }) {
    const displayRows = rows;
    const headers =
      displayRows.length > 0
        ? Object.keys(displayRows[0]).slice(0, 16)
        : ['EmployeeID', 'WorkDate', 'PunchIn', 'PunchOut'];
    const escape = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const head = headers.map((h) => `<th>${escape(h)}</th>`).join('');
    const body = displayRows
      .map(
        (row) =>
          `<tr>${headers.map((h) => `<td>${escape(row[h])}</td>`).join('')}</tr>`,
      )
      .join('');
    const range =
      meta?.from_date && meta?.to_date
        ? `<p><strong>Period:</strong> ${escape(meta.from_date)} to ${escape(meta.to_date)}</p>`
        : '';
    const totalLine =
      meta?.total !== undefined
        ? `<p><strong>Total records:</strong> ${meta.total}</p>`
        : '';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escape(title)}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111}
        h1{font-size:20px;margin:0 0 8px}
        p{margin:4px 0 12px;font-size:12px}
        table{border-collapse:collapse;width:100%;font-size:10px}
        th,td{border:1px solid #d1d5db;padding:4px 6px;text-align:left;vertical-align:top}
        th{background:#f3f4f6;font-weight:600}
        tr:nth-child(even){background:#fafafa}
      </style></head>
      <body>
        <h1>${escape(title)}</h1>
        <p>Generated ${escape(new Date().toISOString())}</p>
        ${range}
        ${totalLine}
        <table><thead><tr>${head}</tr></thead><tbody>${body || '<tr><td colspan="' + headers.length + '">No data</td></tr>'}</tbody></table>
      </body></html>`;
  }
}
