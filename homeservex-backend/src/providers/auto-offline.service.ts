import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { Inject } from '@nestjs/common';

@Injectable()
export class AutoOfflineService {
  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  // Runs every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async autoOfflineInactiveProviders() {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    // Get all categories (because redis key is category-based)
    const categories = await this.prisma.serviceCategory.findMany({
      select: { id: true },
    });

    for (const category of categories) {
      const redisKey = `providers:${category.id}`;

      const providers = await this.redis.hgetall(redisKey);

      for (const [providerId, value] of Object.entries(providers)) {
        type RedisProviderPresence = {
          lat: number | null;
          lng: number | null;
          rating: number;
          lastActive: number;
        };

        const parsed = JSON.parse(value) as unknown;

        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !('lastActive' in parsed)
        ) {
          continue;
        }

        const data = parsed as RedisProviderPresence;

        if (
          typeof data.lastActive === 'number' &&
          data.lastActive < fiveMinutesAgo
        ) {
          await this.redis.hdel(redisKey, providerId);

          await this.prisma.serviceProvider.update({
            where: { id: providerId },
            data: { isOnline: false },
          });

          console.log(`Auto-offlined provider ${providerId}`);
        }
      }
    }
  }
}
