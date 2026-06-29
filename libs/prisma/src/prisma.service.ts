import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';

dotenv.config();

function appendConnectionParam(
  connectionString: string,
  key: string,
  value: string | number,
) {
  const pattern = new RegExp(`;?${key}=`, 'i');
  if (pattern.test(connectionString)) {
    return connectionString;
  }
  const separator = connectionString.endsWith(';') ? '' : ';';
  return `${connectionString}${separator}${key}=${value}`;
}

function normalizeSqlServerConnectionString(
  connectionString: string,
  dbQueryTimeoutMs: number,
) {
  let normalized = connectionString;
  if (!/;?encrypt=/i.test(normalized)) {
    normalized = `${normalized};encrypt=false`;
  }
  normalized = appendConnectionParam(normalized, 'connectionTimeout', 30);
  normalized = appendConnectionParam(
    normalized,
    'requestTimeout',
    dbQueryTimeoutMs,
  );
  return normalized;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  constructor(private readonly configService: ConfigService) {
    const dbQueryTimeoutMs =
      configService.get<number>('dbQueryTimeoutMs') ?? 30_000;
    const connectionString = normalizeSqlServerConnectionString(
      configService.getOrThrow<string>('DATABASE_URL'),
      dbQueryTimeoutMs,
    );

    const adapter = new PrismaMssql(connectionString);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
