import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentEngineService } from './payment-engine.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PaymentSchedulerService {
  constructor(
    private prisma: PrismaService,
    private paymentEngine: PaymentEngineService,
  ) {}

  // Runs every 10 minutes
  @Cron('*/10 * * * *')
  async autoConfirmJobs() {
    const pending = await this.prisma.serviceRequest.findMany({
      where: {
        status: 'AWAITING_CONFIRMATION',
        completedAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const request of pending) {
      await this.paymentEngine.autoConfirmAndRelease(request.id);
    }
  }
}
