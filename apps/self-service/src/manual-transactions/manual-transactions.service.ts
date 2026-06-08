import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AppLoggerService } from '@app/common';
import { WorkflowCommonService } from '../shared/workflow-common.service';

@Injectable()
export class ManualTransactionsService {
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
      if (error?.code === 'P2003') {
        this.common.fail(
          409,
          'One or more transactions cannot be changed as they are associated with other records.',
        );
      }
      this.logger.error(`Manual transaction workflow failed: ${action}`, error);
      this.common.fail(500, 'Internal server error');
    }
  }

  private parseNumberArray(value: any): number[] {
    if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
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

  private whereFromQuery(query: Record<string, any> = {}) {
    const where: any = {};
    const employeeId = this.common.toNumber(query.employee_id);
    if (employeeId) where.employee_id = employeeId;
    if (query.status) where.transaction_status = query.status;
    const dateFilter = this.common.dateFilter(query.from_date, query.to_date);
    if (dateFilter) where.transaction_time = dateFilter;
    return where;
  }

  private async withEmployees(rows: any[]) {
    const employeeIds = rows.map((row) => row.employee_id).filter(Boolean);
    const employees = employeeIds.length
      ? await this.prisma.employee_master.findMany({
          where: { employee_id: { in: employeeIds } },
        })
      : [];
    const employeeMap = Object.fromEntries(
      employees.map((employee) => [employee.employee_id, employee]),
    );
    return rows.map((row) => ({
      ...row,
      employee: employeeMap[row.employee_id],
    }));
  }

  async add(payload: { user: any; body: any; file?: any }) {
    return this.run('add', async () => {
      const attachmentPath =
        this.common.uploadPath(payload.file, '/uploads/manual-transactions') ??
        payload.body?.attachment_path;
      if (!attachmentPath) {
        this.common.fail(
          400,
          "Attachment is required. Send multipart/form-data with file field 'attachment'.",
        );
      }
      const body = payload.body ?? {};
      const employeeId = this.common.toNumber(body.employee_id);
      const reason = body.reason;
      const transactionTime = this.common.parseDate(
        body.transaction_time ?? body.transaction_date,
      );
      if (!employeeId || !reason || !body.remarks || !transactionTime) {
        this.common.fail(400, 'Invalid input');
      }
      const missingMovementId = this.common.toNumber(
        body.Emp_Missing_Movements_Id ?? body.emp_missing_movement_id,
      );
      if (missingMovementId) {
        const existing = await this.prisma.employee_manual_transactions.findFirst({
          where: { emp_missing_movement_id: missingMovementId, reason },
        });
        if (existing) {
          this.common.fail(
            409,
            'Transaction for this missing movement and reason already exists',
          );
        }
      }
      const requesterId = Number(payload.user?.employeeId);
      const created = await this.prisma.employee_manual_transactions.create({
        data: {
          employee_id: employeeId,
          transaction_time: transactionTime,
          emp_missing_movement_id: missingMovementId,
          reason,
          remarks: body.remarks,
          transaction_status: 'Pending',
          created_id: requesterId,
          last_updated_id: requesterId,
          attachment_path: attachmentPath,
        },
      });
      if (missingMovementId) {
        await this.prisma.emp_missing_movements.update({
          where: { emp_missing_Movements_Id: missingMovementId },
          data: reason === 'IN' ? { Status_IN: 'Pending' } : { Status_OUT: 'Pending' },
        });
      }
      this.logger.info('Manual transaction created', {
        employeeId,
        manualTransactionId: created.employee_manual_transaction_id,
      });
      return { message: 'Transaction created successfully', data: created };
    });
  }

  async all(payload: { query: any }) {
    return this.run('all', async () => {
      const { skip, take } = this.common.parsePagination(payload.query);
      const where = this.whereFromQuery(payload.query);
      const [rows, total] = await Promise.all([
        this.prisma.employee_manual_transactions.findMany({
          where,
          skip,
          take,
          orderBy: { employee_manual_transaction_id: 'desc' },
        }),
        this.prisma.employee_manual_transactions.count({ where }),
      ]);
      const data = await this.withEmployees(rows);
      return { success: true, data, hasNext: skip + data.length < total, total };
    });
  }

  async get(payload: { id: number }) {
    return this.run('get', async () => {
      const id = Number(payload.id);
      const data = await this.prisma.employee_manual_transactions.findUnique({
        where: { employee_manual_transaction_id: id },
      });
      if (!data) this.common.fail(404, 'Transaction not found');
      return { success: true, data };
    });
  }

  async edit(payload: { id: number; body: any; file?: any }) {
    return this.run('edit', async () => {
      const id = Number(payload.id);
      const existing = await this.prisma.employee_manual_transactions.findUnique({
        where: { employee_manual_transaction_id: id },
      });
      if (!existing) this.common.fail(404, 'Transaction not found');
      const body = payload.body ?? {};
      const data = await this.prisma.employee_manual_transactions.update({
        where: { employee_manual_transaction_id: id },
        data: this.common.compact({
          employee_id: this.common.toNumber(body.employee_id),
          transaction_time: this.common.parseDate(body.transaction_time),
          emp_missing_movement_id: this.common.toNumber(
            body.Emp_Missing_Movements_Id ?? body.emp_missing_movement_id,
          ),
          reason: body.reason,
          remarks: body.remarks,
          attachment_path:
            this.common.uploadPath(payload.file, '/uploads/manual-transactions') ??
            body.attachment_path,
          last_updated_date: new Date(),
        }),
      });
      return { message: 'Transaction updated successfully', data };
    });
  }

  async delete(payload: { id: number }) {
    return this.run('delete', async () => {
      const id = Number(payload.id);
      const existing = await this.prisma.employee_manual_transactions.findUnique({
        where: { employee_manual_transaction_id: id },
      });
      if (!existing) this.common.fail(404, 'Transaction not found');
      await this.prisma.employee_manual_transactions.delete({
        where: { employee_manual_transaction_id: id },
      });
      return { message: 'Transaction deleted successfully', transaction_id: id };
    });
  }

  async deleteMany(payload: { body: any }) {
    return this.run('deleteMany', async () => {
      const ids = this.parseNumberArray(payload.body?.ids);
      if (!ids.length) {
        this.common.fail(400, "Invalid input, 'ids' must be a non-empty array.");
      }
      const deleted = await this.prisma.employee_manual_transactions.deleteMany({
        where: { employee_manual_transaction_id: { in: ids } },
      });
      return {
        status: true,
        message: `Transactions deleted successfully (${deleted.count} deleted)`,
      };
    });
  }

  async teamAll(payload: { user: any; query: any }) {
    return this.run('teamAll', async () => {
      const managerId = Number(payload.user?.employeeId);
      const teamMembers = await this.prisma.employee_master.findMany({
        where: { manager_id: managerId },
        select: { employee_id: true },
      });
      const ids = teamMembers.map((employee) => employee.employee_id);
      if (!ids.length) {
        return { success: true, data: [], hasNext: false, total: 0 };
      }
      const { skip, take } = this.common.parsePagination(payload.query);
      const where = {
        ...this.whereFromQuery(payload.query),
        employee_id: { in: ids },
      };
      const [rows, total] = await Promise.all([
        this.prisma.employee_manual_transactions.findMany({
          where,
          skip,
          take,
          orderBy: { employee_manual_transaction_id: 'desc' },
        }),
        this.prisma.employee_manual_transactions.count({ where }),
      ]);
      const data = await this.withEmployees(rows);
      return { success: true, data, hasNext: skip + data.length < total, total };
    });
  }

  async approve(payload: { query: any; body: any; user: any }) {
    return this.run('approve', async () => {
      const id = this.common.toNumber(payload.query?.id);
      if (!id) this.common.fail(400, 'Invalid input');
      const requesterId = Number(payload.user?.employeeId);
      const existing = await this.prisma.employee_manual_transactions.findUnique({
        where: { employee_manual_transaction_id: id },
      });
      if (!existing) this.common.fail(404, 'Transaction not found');
      if (existing.transaction_status === 'Approved') {
        this.common.fail(400, 'Transaction is already approved');
      }
      const updated = await this.prisma.employee_manual_transactions.update({
        where: { employee_manual_transaction_id: id },
        data: { transaction_status: 'Approved', last_updated_id: requesterId },
      });
      const event = await this.prisma.employee_event_transactions.create({
        data: {
          employee_id: updated.employee_id,
          transaction_time: updated.transaction_time,
          reason: updated.reason,
          remarks: 'Approved manual transaction',
          user_entry_flag: true,
          created_id: requesterId,
          last_updated_id: requesterId,
          last_updated_date: new Date(),
        },
      });
      if (updated.emp_missing_movement_id) {
        await this.prisma.emp_missing_movements.update({
          where: { emp_missing_Movements_Id: updated.emp_missing_movement_id },
          data:
            updated.reason === 'IN'
              ? {
                  Reason_IN: 'IN',
                  trans_IN_id: event.transaction_id,
                  Trans_IN: event.transaction_time,
                  Status_IN: 'Approved',
                }
              : {
                  Reason_OUT: 'OUT',
                  trans_OUT_id: event.transaction_id,
                  Trans_OUT: event.transaction_time,
                  Status_OUT: 'Approved',
                },
        });
      }
      return { message: 'Transaction approved successfully', data: updated };
    });
  }

  async reject(payload: { query: any }) {
    return this.run('reject', async () => {
      const id = this.common.toNumber(payload.query?.id);
      if (!id) this.common.fail(400, 'Invalid input');
      const existing = await this.prisma.employee_manual_transactions.findUnique({
        where: { employee_manual_transaction_id: id },
      });
      if (!existing) this.common.fail(404, 'Transaction not found');
      if (existing.transaction_status === 'Approved') {
        this.common.fail(400, 'Transaction is already approved');
      }
      const updated = await this.prisma.employee_manual_transactions.update({
        where: { employee_manual_transaction_id: id },
        data: { transaction_status: 'Rejected' },
      });
      if (updated.emp_missing_movement_id) {
        await this.prisma.emp_missing_movements.update({
          where: { emp_missing_Movements_Id: updated.emp_missing_movement_id },
          data:
            updated.reason === 'IN'
              ? { Status_IN: 'Rejected' }
              : { Status_OUT: 'Rejected' },
        });
      }
      return { message: 'Transaction rejected successfully', data: updated };
    });
  }

  async groupApproveTransactions(payload: { body: any; user: any }) {
    return this.run('groupApproveTransactions', async () => {
      const body = payload.body ?? {};
      const requesterId = Number(payload.user?.employeeId);
      const transactionTime = this.common.parseDate(
        body.transaction_time ?? body.transactionTime,
      );
      const reason = body.reason ?? body.Reason;
      if (!transactionTime || !reason) {
        this.common.fail(
          400,
          "Invalid input, 'transaction_time' and 'reason' are required.",
        );
      }
      const employeeIds = this.parseNumberArray(
        body.employeeIds ?? body.employee_ids,
      );
      const targetIds = employeeIds.length
        ? employeeIds
        : (
            await this.prisma.employee_master.findMany({
              select: { employee_id: true },
            })
          ).map((employee) => employee.employee_id);
      for (const employeeId of targetIds) {
        await this.prisma.employee_event_transactions.create({
          data: {
            employee_id: employeeId,
            transaction_time: transactionTime,
            reason,
            remarks: body.remarks ?? body.remark ?? '',
            user_entry_flag: true,
            created_id: requesterId,
            last_updated_id: requesterId,
            last_updated_date: new Date(),
          },
        });
      }
      return {
        message: `Group transaction approved successfully for ${targetIds.length} employees.`,
        numberOfEmployees: targetIds.length,
      };
    });
  }

  async groupApproveByEmployeeIds(payload: { body: any; file?: any; user: any }) {
    return this.run('groupApproveByEmployeeIds', async () => {
      const attachmentPath =
        this.common.uploadPath(payload.file, '/uploads/manual-transactions') ??
        payload.body?.attachment_path;
      if (!attachmentPath) {
        this.common.fail(
          400,
          "Attachment is required. Send multipart/form-data with file field 'attachment'.",
        );
      }
      const body = payload.body ?? {};
      const requesterId = Number(payload.user?.employeeId);
      const employeeIds = this.parseNumberArray(
        body.employeeIds ?? body['employeeIds[]'] ?? body.employee_ids,
      );
      const reason = String(body.reason ?? body.Reason ?? '').toUpperCase();
      const created: any[] = [];
      const createOne = async (employeeId: number, time: Date, txReason: 'IN' | 'OUT') => {
        const row = await this.prisma.employee_manual_transactions.create({
          data: {
            employee_id: employeeId,
            transaction_time: time,
            reason: txReason,
            remarks: body.remarks ?? body.remark ?? '',
            transaction_status: 'Pending',
            created_id: requesterId,
            last_updated_id: requesterId,
            attachment_path: attachmentPath,
          },
        });
        created.push(row);
      };
      if (!employeeIds.length) {
        this.common.fail(400, "Provide 'employeeIds' or 'employee_ids'.");
      }
      if (reason === 'BOTH') {
        const timeIn = this.common.parseDate(
          body.transaction_time_in ?? body.transactionTimeIn,
        );
        const timeOut = this.common.parseDate(
          body.transaction_time_out ?? body.transactionTimeOut,
        );
        if (!timeIn || !timeOut) {
          this.common.fail(
            400,
            "Invalid input, 'transaction_time_in' and 'transaction_time_out' are required when reason is 'BOTH'.",
          );
        }
        for (const employeeId of employeeIds) {
          await createOne(employeeId, timeIn, 'IN');
          await createOne(employeeId, timeOut, 'OUT');
        }
      } else {
        const transactionTime = this.common.parseDate(
          body.transaction_time ?? body.transactionTime,
        );
        if (!transactionTime || (reason !== 'IN' && reason !== 'OUT')) {
          this.common.fail(
            400,
            "Invalid input, 'transaction_time' and reason IN/OUT are required.",
          );
        }
        for (const employeeId of employeeIds) {
          await createOne(employeeId, transactionTime, reason as 'IN' | 'OUT');
        }
      }
      return {
        message: `Manual transactions created successfully for ${created.length} entries.`,
        numberOfTransactions: created.length,
        data: created,
      };
    });
  }
}
