import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RequestsCron {
  constructor(private prisma: PrismaService) {}

  @Cron('*/1 * * * *')
  async expireOpenRequests() {
    await this.prisma.serviceRequest.updateMany({
      where: {
        status: 'OPEN',
        createdAt: {
          lt: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });
  }

  @Cron('*/2 * * * *')
  async penalizeNoShowProviders() {
    const stuck = await this.prisma.serviceRequest.findMany({
      where: {
        status: 'ASSIGNED',
        assignedAt: {
          lt: new Date(Date.now() - 10 * 60 * 1000),
        },
      },
    });

    for (const req of stuck) {
      await this.prisma.serviceRequest.update({
        where: { id: req.id },
        data: { status: 'CANCELLED' },
      });
    }
  }
}
