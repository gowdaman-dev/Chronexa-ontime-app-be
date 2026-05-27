import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';

dotenv.config();

function normalizeSqlServerConnectionString(connectionString: string) {
  if (/;?encrypt=/i.test(connectionString)) {
    return connectionString;
  }

  return `${connectionString};encrypt=false`;
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    const connectionString = normalizeSqlServerConnectionString(
      configService.getOrThrow<string>('DATABASE_URL'),
    );

    const adapter = new PrismaMssql(connectionString);

    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  [key: string]: any;

  get $connect() {
    return this.prisma.$connect.bind(this.prisma);
  }

  get $disconnect() {
    return this.prisma.$disconnect.bind(this.prisma);
  }

  get $transaction() {
    return this.prisma.$transaction.bind(this.prisma);
  }
}
