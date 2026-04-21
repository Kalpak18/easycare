import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const client = new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT) || 6379,
          connectTimeout: 10000,
          maxRetriesPerRequest: null,
          lazyConnect: true,
          retryStrategy(times) {
            return Math.min(times * 100, 2000);
          },
        });

        client.on('connect', () => {
          console.log('✅ Redis connected');
        });

        client.on('error', (err) => {
          console.error('❌ Redis error:', err);
        });

        client.on('reconnecting', () => {
          console.warn('⚠️ Redis reconnecting...');
        });

        return client;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}