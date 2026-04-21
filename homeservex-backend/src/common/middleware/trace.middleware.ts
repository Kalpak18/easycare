import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    req.traceId = randomUUID();
    res.setHeader('X-Trace-Id', req.traceId);
    next();
  }
}
