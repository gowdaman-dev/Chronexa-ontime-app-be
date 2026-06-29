import { RpcException } from '@nestjs/microservices';
import { AppLoggerService } from '../services/app-logger.service';

export type PrismaErrorHandlers = Partial<
  Record<string, (error: { code?: string; meta?: unknown }) => never>
>;

const DEFAULT_PRISMA_HANDLERS: PrismaErrorHandlers = {
  P2002: () => {
    throw new RpcException({
      statusCode: 400,
      message: 'A record with this value already exists',
    });
  },
  P2003: () => {
    throw new RpcException({
      statusCode: 400,
      message: 'Invalid reference ID',
    });
  },
  P2025: () => {
    throw new RpcException({
      statusCode: 404,
      message: 'Record not found',
    });
  },
};

export function microserviceFail(
  logger: AppLoggerService,
  statusCode: number,
  message: string,
  extra?: Record<string, unknown>,
  logContext = 'Microservice error',
): never {
  const meta = { statusCode, ...extra };
  if (statusCode >= 500) {
    logger.error(logContext, { message, ...meta });
  } else {
    logger.warn(logContext, { message, ...meta });
  }
  throw new RpcException({ statusCode, message, ...extra });
}

export async function runMicroserviceAction<T>(
  logger: AppLoggerService,
  action: string,
  fn: () => Promise<T>,
  options: {
    failMessage?: string;
    prismaHandlers?: PrismaErrorHandlers;
    logContext?: string;
  } = {},
): Promise<T> {
  const failMessage = options.failMessage ?? 'Internal server error';
  const logContext = options.logContext ?? 'Microservice action failed';
  const prismaHandlers = {
    ...DEFAULT_PRISMA_HANDLERS,
    ...options.prismaHandlers,
  };

  try {
    return await fn();
  } catch (error: any) {
    if (error?.getError) throw error;

    const code = error?.code as string | undefined;
    if (code && prismaHandlers[code]) {
      prismaHandlers[code](error);
    }

    logger.error(`${logContext}: ${action}`, error);
    microserviceFail(logger, 500, failMessage);
  }
}
