import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
  log(message: string, meta?: Record<string, any>) {
    console.log(
      JSON.stringify({
        level: 'INFO',
        message,
        ...meta,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  error(message: string, meta?: Record<string, any>) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        message,
        ...meta,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
