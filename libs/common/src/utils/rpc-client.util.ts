import { HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError, timeout, TimeoutError } from 'rxjs';
import { AppLoggerService } from '../services/app-logger.service';

export type RpcSendOptions = {
  rpcTimeoutMs?: number;
  pattern?: string;
};

function parseRpcError(err: any) {
  const rpcBody =
    typeof err?.message === 'object' && err.message !== null
      ? err.message
      : (err?.response ?? err);
  const statusCode = rpcBody?.statusCode ?? err?.statusCode;
  return { rpcBody, statusCode };
}

export async function sendRpc<T>(
  client: ClientProxy,
  pattern: string,
  data: unknown,
  logger?: AppLoggerService,
  options: RpcSendOptions = {},
): Promise<T> {
  const rpcTimeoutMs = options.rpcTimeoutMs ?? 30_000;
  const logPattern = options.pattern ?? pattern;

  return firstValueFrom(
    client.send<T>(pattern, data ?? {}).pipe(
      timeout(rpcTimeoutMs),
      catchError((err: any) => {
        if (err instanceof TimeoutError) {
          logger?.error('RPC call timed out', err, {
            pattern: logPattern,
            rpcTimeoutMs,
          });
          return throwError(
            () =>
              new HttpException(
                'Service request timed out',
                HttpStatus.GATEWAY_TIMEOUT,
              ),
          );
        }

        const { rpcBody, statusCode } = parseRpcError(err);
        if (statusCode) {
          logger?.warn('RPC call returned application error', {
            pattern: logPattern,
            statusCode,
            message: rpcBody?.message,
          });
          return throwError(() => new HttpException(rpcBody, statusCode));
        }

        if (err?.statusCode) {
          logger?.warn('RPC call returned application error', {
            pattern: logPattern,
            statusCode: err.statusCode,
            message: err.message,
          });
          return throwError(
            () => new HttpException(err.message, err.statusCode),
          );
        }

        logger?.error('RPC call failed', err, { pattern: logPattern });
        return throwError(
          () =>
            new HttpException(
              'Service unavailable',
              HttpStatus.SERVICE_UNAVAILABLE,
            ),
        );
      }),
    ),
  );
}
