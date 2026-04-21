import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProviderHeartbeatWorker {
  private readonly logger = new Logger(ProviderHeartbeatWorker.name);

  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private prisma: PrismaService,
  ) {}

  @Cron('*/15 * * * * *')
  async cleanInactiveProviders() {
    try {
      const providers = await this.prisma.serviceProvider.findMany({
        where: { isOnline: true },
        select: { id: true, categoryId: true },
      });

      for (const provider of providers) {
        try {
          const heartbeat = await this.redis.get(`provider:heartbeat:${provider.id}`);

          if (!heartbeat) {
            await this.redis.hdel(`providers:${provider.categoryId}`, provider.id);
            await this.prisma.serviceProvider.update({
              where: { id: provider.id },
              data: { isOnline: false },
            });
          }
        } catch (err) {
          this.logger.error(`heartbeat check failed for provider ${provider.id}`, err);
        }
      }
    } catch (err) {
      this.logger.error('cleanInactiveProviders failed', err);
    }
  }
}
