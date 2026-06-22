import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@app/common';
import { WorkflowCommonService } from '../shared/workflow-common.service';
import { ReportQueryService } from '../shared/report-query.service';
import { ReportPdfService } from '../shared/report-pdf.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly common: WorkflowCommonService,
    private readonly reportQuery: ReportQueryService,
    private readonly reportPdf: ReportPdfService,
    private readonly logger: AppLoggerService,
  ) {}

  private roleScope(user: any, query: Record<string, any> = {}) {
    const role = String(user?.role ?? '').toLowerCase();
    const explicitEmployeeId = this.common.resolveEmployeeId(query);
    if (role.includes('admin')) return {};
    if (this.common.isManagerRole(user)) {
      return { managerId: Number(user?.employeeId) };
    }
    return { employeeId: explicitEmployeeId ?? Number(user?.employeeId) };
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
      const range = this.reportQuery.resolveDateRange(period, payload.query ?? {});
      const format = String(payload.query?.format ?? 'json').toLowerCase();
      const query = { ...(payload.query ?? {}), ...range };
      const scope = this.roleScope(payload.user, query);
      const result = await this.reportQuery.querySpEmployeeDailyReport(query, scope);
      const title = `${period.toUpperCase()} ATTENDANCE REPORT`;
      if (format === 'pdf' || format === 'html') {
        const html = this.reportQuery.buildReportHtml(title, result.data, {
          from_date: range.from_date,
          to_date: range.to_date,
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
      return { success: true, period, ...range, ...result };
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
    return this.daily(payload);
  }
}
