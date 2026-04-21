import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus } from '@prisma/client';

@Injectable()
export class AutoExpireService {
  constructor(private prisma: PrismaService) {}

  // Runs every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async expireOldRequests() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const expired = await this.prisma.serviceRequest.updateMany({
      where: {
        status: RequestStatus.OPEN,
        createdAt: {
          lte: fifteenMinutesAgo,
        },
      },
      data: {
        status: RequestStatus.EXPIRED,
      },
    });

    if (expired.count > 0) {
      console.log(`Expired ${expired.count} stale requests`);
    }
  }
}
