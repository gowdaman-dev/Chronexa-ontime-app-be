import { PrismaService } from '@app/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.audit_log.create({
      data,
    });
  }
}
