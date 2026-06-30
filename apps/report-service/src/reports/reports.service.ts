import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@app/common';
import { ReportCommonService } from '../shared/report-common.service';
import { ReportQueryService } from '../shared/report-query.service';
import { ReportPdfService } from '../shared/report-pdf.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly common: ReportCommonService,
    private readonly reportQuery: ReportQueryService,
    private readonly reportPdf: ReportPdfService,
    private readonly logger: AppLoggerService,
  ) {}

  private roleScope(user: any, query: Record<string, any> = {}) {
    const role = String(user?.role ?? '').toLowerCase();
    const explicitEmployeeId = this.common.resolveEmployeeId(query);
    const ownEmployeeId = Number(user?.employeeId);
    if (role.includes('admin')) return {};
    if (this.common.isManagerRole(user)) {
      if (explicitEmployeeId && explicitEmployeeId === ownEmployeeId) {
        return { employeeId: ownEmployeeId };
      }
      return { managerId: ownEmployeeId };
    }
    return { employeeId: explicitEmployeeId ?? ownEmployeeId };
  }

  private async run<T>(action: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.getError) throw error;
      this.logger.error(`Reports failed: ${action}`, error);
      this.common.fail(500, 'Internal server error');
    }
  }

  private async periodReport(
    period: 'daily' | 'weekly' | 'monthly',
    payload: { query: any; user: any },
  ) {
    return this.run(period, async () => {
      const baseQuery = payload.query ?? {};
      const range = this.reportQuery.resolveDateRange(period, baseQuery);
      const format = String(baseQuery.format ?? 'json').toLowerCase();
      const query = { ...baseQuery, ...range };
      if (range.from_date || range.to_date) {
        delete query.date;
      }
      const dateMeta = this.reportQuery.reportDateMeta(baseQuery, range);
      const scope = this.roleScope(payload.user, query);
      const result = await this.reportQuery.querySpEmployeeDailyReport(query, scope);
      const title = `${period.toUpperCase()} ATTENDANCE REPORT`;
      if (format === 'pdf' || format === 'html') {
        const html = this.reportQuery.buildReportHtml(title, result.data, {
          ...dateMeta,
          total: result.total,
        });
        if (format === 'pdf') {
          const pdfBuffer = await this.reportPdf.htmlToPdfBuffer(html);
          return {
            success: true,
            format: 'pdf',
            title,
            pdfBase64: pdfBuffer.toString('base64'),
            total: result.total,
            hasNext: result.hasNext,
          };
        }
        return {
          success: true,
          format,
          title,
          html,
          total: result.total,
          hasNext: result.hasNext,
        };
      }
      return { success: true, period, ...dateMeta, ...result };
    });
  }

  private async attendanceReport(payload: { query: any; user: any }) {
    return this.run('attendance', async () => {
      const query = payload.query ?? {};
      const format = String(query.format ?? 'json').toLowerCase();
      const dateMeta = this.reportQuery.reportDateMeta(query);
      const scope = this.roleScope(payload.user, query);
      const result = await this.reportQuery.querySpEmployeeDailyReport(query, scope);
      const title = 'ATTENDANCE REPORT';
      if (format === 'pdf' || format === 'html') {
        const html = this.reportQuery.buildReportHtml(title, result.data, {
          ...dateMeta,
          total: result.total,
        });
        if (format === 'pdf') {
          const pdfBuffer = await this.reportPdf.htmlToPdfBuffer(html);
          return {
            success: true,
            format: 'pdf',
            title,
            pdfBase64: pdfBuffer.toString('base64'),
            total: result.total,
            hasNext: result.hasNext,
          };
        }
        return {
          success: true,
          format,
          title,
          html,
          total: result.total,
          hasNext: result.hasNext,
        };
      }
      return { success: true, period: 'attendance', ...dateMeta, ...result };
    });
  }

  daily(payload: { query: any; user: any }) {
    return this.periodReport('daily', payload);
  }

  weekly(payload: { query: any; user: any }) {
    return this.periodReport('weekly', payload);
  }

  monthly(payload: { query: any; user: any }) {
    return this.periodReport('monthly', payload);
  }

  attendance(payload: { query: any; user: any }) {
    return this.attendanceReport(payload);
  }
}
