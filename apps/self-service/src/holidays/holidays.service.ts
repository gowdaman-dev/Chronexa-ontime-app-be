import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AppLoggerService } from '@app/common';
import { WorkflowCommonService } from '../shared/workflow-common.service';

@Injectable()
export class HolidaysService {
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
      if (error?.code === 'P2002') {
        this.common.fail(400, 'Holiday with the same name already exists');
      }
      this.logger.error(`Holidays failed: ${action}`, error);
      this.common.fail(500, 'Internal server error');
    }
  }

  private whereFromQuery(query: Record<string, any> = {}) {
    const where: any = {};
    if (query.search || query.name) {
      const term = String(query.search ?? query.name);
      where.OR = [
        { holiday_eng: { contains: term } },
        { holiday_arb: { contains: term } },
      ];
    }
    if (this.common.toBoolean(query.recurring_flag) !== undefined) {
      where.recurring_flag = this.common.toBoolean(query.recurring_flag);
    }
    if (this.common.toBoolean(query.public_holiday_flag) !== undefined) {
      where.public_holiday_flag = this.common.toBoolean(query.public_holiday_flag);
    }
    return where;
  }

  private filterHolidaysByYearMonth(
    rows: any[],
    year?: number,
    month?: number,
  ) {
    let holidays = rows;
    if (year) {
      holidays = holidays.filter((holiday) => {
        if (!holiday.from_date) return false;
        return new Date(holiday.from_date).getFullYear() === year;
      });
    }
    if (year && month) {
      holidays = holidays.filter((holiday) => {
        if (!holiday.from_date) return false;
        const holidayDate = new Date(holiday.from_date);
        return (
          holidayDate.getFullYear() === year &&
          holidayDate.getMonth() + 1 === month
        );
      });
    }
    return holidays;
  }

  async all(payload: { query?: any }) {
    return this.run('all', async () => {
      const query = payload.query ?? {};
      const { skip, take } = this.common.parsePagination(query);
      const year = this.common.toNumber(query.year);
      const month = this.common.toNumber(query.month);
      const rows = await this.prisma.holidays.findMany({
        where: this.whereFromQuery(query),
        orderBy: { from_date: 'asc' },
      });
      const filtered = this.filterHolidaysByYearMonth(rows, year, month);
      const data = filtered.slice(skip, skip + take);
      const total = filtered.length;
      return { success: true, data, total, hasNext: skip + data.length < total };
    });
  }

  async get(payload: { id: number }) {
    return this.run('get', async () => {
      const data = await this.prisma.holidays.findUnique({
        where: { holiday_id: Number(payload.id) },
      });
      if (!data) this.common.fail(404, 'Holiday not found');
      return { success: true, data };
    });
  }

  async upcoming(payload: { query?: any }) {
    return this.run('upcoming', async () => {
      const days = this.common.toNumber(payload.query?.days) ?? 30;
      const now = new Date();
      const end = new Date();
      end.setDate(end.getDate() + days);
      const data = await this.prisma.holidays.findMany({
        where: { from_date: { gte: now, lte: end } },
        orderBy: { from_date: 'asc' },
      });
      return { success: true, data, total: data.length };
    });
  }

  search(payload: { query: any }) {
    return this.all(payload);
  }

  async add(payload: { body: any; user: any }) {
    return this.run('add', async () => {
      const body = payload.body ?? {};
      const actorId = Number(payload.user?.employeeId ?? body.created_id ?? 1);
      const fromDate = this.common.parseDate(body.from_date);
      const toDate = this.common.parseDate(body.to_date);
      if (!fromDate || !toDate || !body.holiday_eng) {
        this.common.fail(400, 'Invalid input');
      }
      const data = await this.prisma.holidays.create({
        data: {
          holiday_eng: body.holiday_eng,
          holiday_arb: body.holiday_arb ?? body.holiday_eng,
          remarks: body.remarks,
          from_date: fromDate,
          to_date: toDate,
          recurring_flag: this.common.toBoolean(body.recurring_flag) ?? false,
          public_holiday_flag: this.common.toBoolean(body.public_holiday_flag) ?? false,
          created_id: actorId,
          last_updated_id: actorId,
        },
      });
      return { message: 'Holiday created successfully', data };
    });
  }

  async edit(payload: { id: number; body: any; user: any }) {
    return this.run('edit', async () => {
      const id = Number(payload.id);
      const existing = await this.prisma.holidays.findUnique({ where: { holiday_id: id } });
      if (!existing) this.common.fail(404, 'Holiday not found');
      const body = payload.body ?? {};
      const data = await this.prisma.holidays.update({
        where: { holiday_id: id },
        data: this.common.compact({
          holiday_eng: body.holiday_eng,
          holiday_arb: body.holiday_arb,
          remarks: body.remarks,
          from_date: this.common.parseDate(body.from_date),
          to_date: this.common.parseDate(body.to_date),
          recurring_flag: this.common.toBoolean(body.recurring_flag),
          public_holiday_flag: this.common.toBoolean(body.public_holiday_flag),
          last_updated_id: Number(payload.user?.employeeId ?? body.last_updated_id ?? 1),
          last_updated_date: new Date(),
        }),
      });
      return { message: 'Holiday updated successfully', data };
    });
  }

  async delete(payload: { id: number }) {
    return this.run('delete', async () => {
      await this.prisma.holidays.delete({ where: { holiday_id: Number(payload.id) } });
      return { message: 'Holiday deleted successfully', holiday_id: Number(payload.id) };
    });
  }

  async deleteMany(payload: { body: any }) {
    return this.run('deleteMany', async () => {
      const ids = this.common.parseNumberArray(payload.body?.ids);
      if (!ids.length) this.common.fail(400, "Invalid input, 'ids' must be a non-empty array.");
      const deleted = await this.prisma.holidays.deleteMany({
        where: { holiday_id: { in: ids } },
      });
      return {
        status: true,
        message: `Holidays deleted successfully (${deleted.count} deleted)`,
      };
    });
  }
}
