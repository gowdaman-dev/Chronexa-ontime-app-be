import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { WorkflowCommonService } from './workflow-common.service';

export type ReportRoleScope = {
  employeeId?: number;
  managerId?: number;
};

@Injectable()
export class ReportQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly common: WorkflowCommonService,
  ) {}

  buildSpWhere(query: Record<string, any> = {}, scope?: ReportRoleScope) {
    const conditions: string[] = [`EmployeeStatus='Active'`];

    if (query.from_date) {
      conditions.push(`WorkDate >= '${String(query.from_date).slice(0, 10)}'`);
    }
    if (query.to_date) {
      conditions.push(`WorkDate <= '${String(query.to_date).slice(0, 10)}'`);
    }
    if (query.date) {
      conditions.push(`WorkDate = '${String(query.date).slice(0, 10)}'`);
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
      const val =
        query.isabsent === true ||
        query.isabsent === 'true' ||
        query.isabsent === '1'
          ? '1'
          : '0';
      conditions.push(`IsAbsent = '${val}'`);
    }

    if (query.costcode) conditions.push(`CostCode = '${query.costcode}'`);
    if (query.costcenter) conditions.push(`CostCenter = '${query.costcenter}'`);

    return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  async querySpEmployeeDailyReport(
    query: Record<string, any> = {},
    scope?: ReportRoleScope,
  ) {
    const whereClause = this.buildSpWhere(query, scope);
    const { skip, take } = this.common.parsePagination(query);
    const dataQuery = `
      SELECT * FROM [dbo].[sp_employee_daily_report]
      ${whereClause}
      ORDER BY WorkDate DESC, EmployeeID
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `;
    const countQuery = `
      SELECT COUNT(*) as cnt FROM [dbo].[sp_employee_daily_report]
      ${whereClause}
    `;
    const [data, countResult] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(dataQuery),
      this.prisma.$queryRawUnsafe<any[]>(countQuery),
    ]);
    const total = countResult?.[0]
      ? Number(countResult[0].cnt ?? countResult[0].COUNT ?? 0)
      : 0;
    return { data, total, hasNext: skip + data.length < total };
  }

  resolveDateRange(
    period: 'daily' | 'weekly' | 'monthly',
    query: Record<string, any> = {},
  ) {
    const anchor = query.date
      ? new Date(String(query.date))
      : query.from_date
        ? new Date(String(query.from_date))
        : new Date();
    const start = new Date(anchor);
    const end = new Date(anchor);

    if (period === 'daily') {
      // single day
    } else if (period === 'weekly') {
      start.setDate(start.getDate() - 6);
    } else {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    }

    return {
      from_date: start.toISOString().slice(0, 10),
      to_date: end.toISOString().slice(0, 10),
    };
  }

  buildReportHtml(title: string, rows: any[]) {
    const headers =
      rows.length > 0
        ? Object.keys(rows[0]).slice(0, 12)
        : ['EmployeeID', 'Name', 'WorkDate', 'PunchIn', 'PunchOut'];
    const head = headers.map((h) => `<th>${h}</th>`).join('');
    const body = rows
      .map(
        (row) =>
          `<tr>${headers.map((h) => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`,
      )
      .join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>body{font-family:Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ccc;padding:6px 8px;font-size:12px}th{background:#f3f4f6}</style></head>
      <body><h1>${title}</h1><p>Generated ${new Date().toISOString()}</p>
      <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  }
}
