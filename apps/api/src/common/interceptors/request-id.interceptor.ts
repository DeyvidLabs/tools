import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const incoming = request.headers['x-request-id'];
    const requestId =
      typeof incoming === 'string' && /^[A-Za-z0-9._-]{1,64}$/.test(incoming)
        ? incoming
        : randomUUID();
    (request.headers as Record<string, string>)['x-request-id'] = requestId;
    response.setHeader('X-Request-Id', requestId);
    return next.handle();
  }
}
