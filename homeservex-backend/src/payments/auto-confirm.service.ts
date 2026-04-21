import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentEngineService } from './payment-engine.service';

@Injectable()
export class AutoConfirmService {
  constructor(
    private prisma: PrismaService,
    private paymentEngine: PaymentEngineService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoConfirmJobs() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingJobs = await this.prisma.serviceRequest.findMany({
      where: {
        status: 'AWAITING_CONFIRMATION',
        completedAt: {
          lte: twentyFourHoursAgo,
        },
      },
      select: { id: true },
    });

    for (const job of pendingJobs) {
      try {
        await this.paymentEngine.autoConfirmAndRelease(job.id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';

        console.error(`Auto-confirm failed for job ${job.id}:`, message);
      }
    }
  }
}
