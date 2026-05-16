/**
 * Converso VPN - Logging Interceptor
 * Structured JSON logging with Pino
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers } = request;
    const requestId = headers['x-request-id'];
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;
          const logLevel = response.statusCode >= 400 ? 'warn' : 'info';

          this.logger.log({
            level: logLevel,
            requestId,
            method,
            url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error({
            requestId,
            method,
            url,
            statusCode: 500,
            duration: `${duration}ms`,
            error: error.message,
          });
        },
      }),
    );
  }
}