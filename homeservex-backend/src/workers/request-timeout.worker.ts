import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class RequestTimeoutWorker {
  private readonly logger = new Logger(RequestTimeoutWorker.name);

  constructor(
    private prisma: PrismaService,
    private realtimeService: RealtimeService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  @Cron('*/10 * * * * *')
  async checkTimeouts() {
    try {
      const requests = await this.prisma.serviceRequest.findMany({
        where: { status: 'OPEN' },
      });

      for (const request of requests) {
        try {
          const key = `request:broadcast:${request.id}`;
          const timestamp = await this.redis.get(key);

          if (!timestamp) continue;

          const elapsed = Date.now() - Number(timestamp);
          if (elapsed < 20000) continue;

          const providers = await this.prisma.serviceProvider.findMany({
            where: {
              categoryId: request.categoryId,
              isOnline: true,
              isVerified: true,
            },
            take: 5,
          });

          for (const p of providers) {
            this.realtimeService.emitNewRequest(p.id, {
              requestId: request.id,
              description: request.description,
              lat: request.latitude,
              lng: request.longitude,
            });
          }

          await this.redis.set(key, Date.now(), 'EX', 120);
        } catch (err) {
          this.logger.error(`checkTimeout failed for request ${request.id}`, err);
        }
      }
    } catch (err) {
      this.logger.error('checkTimeouts failed', err);
    }
  }
}
