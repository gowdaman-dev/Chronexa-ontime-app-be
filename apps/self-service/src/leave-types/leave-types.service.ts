import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AppLoggerService } from '@app/common';
import { WorkflowCommonService } from '../shared/workflow-common.service';

@Injectable()
export class LeaveTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly common: WorkflowCommonService,
    private readonly logger: AppLoggerService,
  ) {}

  private async run<T>(action: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.getError) throw error;
      if (error?.code === 'P2002') this.common.fail(400, 'Leave type code already exists.');
      if (error?.code === 'P2003') this.common.fail(400, 'Invalid reference in leave type payload.');
      this.logger.error(`Leave types failed: ${action}`, error);
      this.common.fail(500, 'Internal server error');
    }
  }

  private whereFromQuery(query: Record<string, any> = {}) {
    const where: any = {};
    if (query.search) {
      const term = String(query.search);
      where.OR = [
        { leave_type_code: { contains: term } },
        { leave_type_eng: { contains: term } },
        { leave_type_arb: { contains: term } },
      ];
    }
    if (this.common.toBoolean(query.status_flag) !== undefined) {
      where.status_flag = this.common.toBoolean(query.status_flag);
    }
    return where;
  }

  async all(payload: { query?: any }) {
    return this.run('all', async () => {
      const { skip, take } = this.common.parsePagination(payload.query);
      const where = this.whereFromQuery(payload.query);
      const [data, total] = await Promise.all([
        this.prisma.leave_types.findMany({
          where,
          skip,
          take,
          orderBy: { leave_type_id: 'desc' },
        }),
        this.prisma.leave_types.count({ where }),
      ]);
      return { success: true, data, total, hasNext: skip + data.length < total };
    });
  }

  active() {
    return this.all({ query: { status_flag: true, limit: 1000, offset: 1 } });
  }

  dropdown() {
    return this.run('dropdown', async () => {
      const data = await this.prisma.leave_types.findMany({
        where: { status_flag: true },
        select: {
          leave_type_id: true,
          leave_type_code: true,
          leave_type_eng: true,
          leave_type_arb: true,
        },
        orderBy: { leave_type_eng: 'asc' },
      });
      return { success: true, data };
    });
  }

  async get(payload: { id: number }) {
    return this.run('get', async () => {
      const id = Number(payload.id);
      const data = await this.prisma.leave_types.findUnique({ where: { leave_type_id: id } });
      if (!data) this.common.fail(404, 'Leave type not found');
      return { success: true, data };
    });
  }

  async add(payload: { body: any; user: any }) {
    return this.run('add', async () => {
      const body = payload.body ?? {};
      const actorId = Number(payload.user?.employeeId ?? body.created_id ?? 1);
      const data = await this.prisma.leave_types.create({
        data: this.common.compact({
          leave_type_code: body.leave_type_code,
          leave_type_eng: body.leave_type_eng ?? body.leave_type_arb,
          leave_type_arb: body.leave_type_arb ?? body.leave_type_eng,
          need_approval_flag: this.common.toBoolean(body.need_approval_flag) ?? false,
          official_flag: this.common.toBoolean(body.official_flag) ?? false,
          status_flag: this.common.toBoolean(body.status_flag ?? body.status_Flag) ?? true,
          allow_attachment_flag: this.common.toBoolean(body.allow_attachment_flag) ?? false,
          workflow_id: this.common.toNumber(body.workflow_id),
          mandatory_justification_flag:
            this.common.toBoolean(body.mandatory_justification_flag) ?? false,
          total_entitled_days: body.total_entitled_days,
          full_pay_days: body.full_pay_days,
          half_pay_days: body.half_pay_days,
          unpaid_days: body.unpaid_days,
          apply_prior_to_days: body.apply_prior_to_days,
          is_AL_flag: this.common.toBoolean(body.is_AL_flag) ?? false,
          is_SL_flag: this.common.toBoolean(body.is_SL_flag) ?? false,
          exclude_holiday_flag: this.common.toBoolean(body.exclude_holiday_flag) ?? false,
          exclude_weekend_flag: this.common.toBoolean(body.exclude_weekend_flag) ?? false,
          carryforward_flag: this.common.toBoolean(body.carryforward_flag) ?? false,
          specific_gender: body.specific_gender,
          created_id: actorId,
          last_updated_id: actorId,
        }) as any,
      });
      return { message: 'Leave type created successfully', data };
    });
  }

  async edit(payload: { id: number; body: any; user: any }) {
    return this.run('edit', async () => {
      const id = Number(payload.id);
      const existing = await this.prisma.leave_types.findUnique({ where: { leave_type_id: id } });
      if (!existing) this.common.fail(404, 'Leave type not found');
      const body = payload.body ?? {};
      const data = await this.prisma.leave_types.update({
        where: { leave_type_id: id },
        data: this.common.compact({
          leave_type_code: body.leave_type_code ?? body.code,
          leave_type_eng: body.leave_type_eng,
          leave_type_arb: body.leave_type_arb,
          status_flag: this.common.toBoolean(body.status_flag ?? body.status_Flag),
          need_approval_flag: this.common.toBoolean(body.need_approval_flag),
          allow_attachment_flag: this.common.toBoolean(body.allow_attachment_flag),
          workflow_id: this.common.toNumber(body.workflow_id),
          carryforward_flag: this.common.toBoolean(body.carryforward_flag),
          specific_gender: body.specific_gender,
          last_updated_id: Number(payload.user?.employeeId ?? body.last_updated_id ?? 1),
          last_updated_date: new Date(),
        }),
      });
      return { message: 'Leave type updated successfully', data };
    });
  }

  async delete(payload: { id: number }) {
    return this.run('delete', async () => {
      const id = Number(payload.id);
      const refs = await this.prisma.employee_leaves.count({ where: { leave_type_id: id } });
      if (refs > 0) {
        this.common.fail(400, 'Cannot delete leave type referenced by employee leaves.');
      }
      await this.prisma.leave_types.delete({ where: { leave_type_id: id } });
      return { message: 'Leave type deleted successfully', leave_type_id: id };
    });
  }

  async deleteMany(payload: { body: any }) {
    return this.run('deleteMany', async () => {
      const ids = this.common.parseNumberArray(payload.body?.ids);
      if (!ids.length) this.common.fail(400, "Invalid input, 'ids' must be a non-empty array.");
      const deleted = await this.prisma.leave_types.deleteMany({
        where: { leave_type_id: { in: ids } },
      });
      return {
        status: true,
        message: `Leave types deleted successfully (${deleted.count} deleted)`,
      };
    });
  }
}
