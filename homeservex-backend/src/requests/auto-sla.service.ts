import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus } from '@prisma/client';
import { RiskEngineService } from 'src/providers/risk-engine.service';
import { PerformanceEngineService } from 'src/providers/performance-engine.service';

@Injectable()
export class AutoSlaService {
  constructor(
    private prisma: PrismaService,
    private riskEngine: RiskEngineService,
    private performanceEngine: PerformanceEngineService,
  ) {}

  // Runs every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAssignedTimeout() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const stuckRequests = await this.prisma.serviceRequest.findMany({
      where: {
        status: RequestStatus.ASSIGNED,
        assignedAt: {
          lte: tenMinutesAgo,
        },
      },
    });

    for (const request of stuckRequests) {
      await this.prisma.serviceRequest.update({
        where: { id: request.id },
        data: { status: RequestStatus.CANCELLED },
      });

      if (request.providerId) {
        // Increase provider risk
        await this.riskEngine.evaluate(request.providerId);
      }
      if (request.providerId) {
        await this.performanceEngine.adjust(request.providerId, -5);
      }

      console.log(`SLA violation - cancelled request ${request.id}`);
    }
  }
}
