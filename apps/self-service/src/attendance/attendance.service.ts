import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@app/common';
import { WorkflowCommonService } from '../shared/workflow-common.service';
import { ReportQueryService } from '../shared/report-query.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly common: WorkflowCommonService,
    private readonly reportQuery: ReportQueryService,
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
      this.logger.error(`Attendance failed: ${action}`, error);
      this.common.fail(500, 'Internal server error');
    }
  }

  async daily(payload: { query: any; user: any }) {
    return this.run('daily', async () => {
      const scope = this.roleScope(payload.user, payload.query);
      const result = await this.reportQuery.querySpEmployeeDailyReport(
        payload.query,
        scope,
      );
      return { success: true, ...result };
    });
  }
}
