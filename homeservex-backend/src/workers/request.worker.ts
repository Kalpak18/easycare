import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus } from '@prisma/client';
import { PaymentEngineService } from '../payments/payment-engine.service';

@Injectable()
export class RequestWorker {
  private readonly logger = new Logger(RequestWorker.name);

  constructor(
    private prisma: PrismaService,
    private paymentEngine: PaymentEngineService,
  ) {}

  @Cron('*/30 * * * * *')
  async expireOpenRequests() {
    try {
      const expiryTime = new Date(Date.now() - 2 * 60 * 1000);
      await this.prisma.serviceRequest.updateMany({
        where: { status: RequestStatus.OPEN, createdAt: { lt: expiryTime } },
        data: { status: RequestStatus.EXPIRED },
      });
    } catch (err) {
      this.logger.error('expireOpenRequests failed', err);
    }
  }

  @Cron('*/60 * * * * *')
  async autoConfirmJobs() {
    try {
      const expiryTime = new Date(Date.now() - 30 * 60 * 1000);
      const jobs = await this.prisma.serviceRequest.findMany({
        where: {
          status: RequestStatus.AWAITING_CONFIRMATION,
          completedAt: { lt: expiryTime },
        },
      });

      for (const job of jobs) {
        try {
          await this.paymentEngine.autoConfirmAndRelease(job.id);
        } catch (err) {
          this.logger.error(`autoConfirm failed for job ${job.id}`, err);
        }
      }
    } catch (err) {
      this.logger.error('autoConfirmJobs failed', err);
    }
  }
}
