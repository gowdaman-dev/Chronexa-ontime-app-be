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
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  constructor(private readonly configService: ConfigService) {
    const connectionString = normalizeSqlServerConnectionString(
      configService.getOrThrow<string>('DATABASE_URL'),
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
