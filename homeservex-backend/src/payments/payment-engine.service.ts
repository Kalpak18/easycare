import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMode, RequestStatus } from '@prisma/client';
import { PerformanceEngineService } from 'src/providers/performance-engine.service';

@Injectable()
export class PaymentEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly performanceEngine: PerformanceEngineService,
  ) {}

  // --------------------------------------------------
  // Provider marks job complete → Await confirmation
  // --------------------------------------------------

  async prepareForConfirmation(requestId: string, finalAmount: number) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.findUnique({
        where: { id: requestId },
      });

      if (!request || request.status !== RequestStatus.IN_PROGRESS) {
        throw new ForbiddenException('Invalid request state');
      }

      const rule = await tx.commissionRule.findUnique({
        where: { categoryId: request.categoryId },
      });

      const commission = rule ? (finalAmount * rule.percentage) / 100 : 0;
      const providerAmount = finalAmount - commission;

      await tx.serviceRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.AWAITING_CONFIRMATION,
          totalAmount: finalAmount,
          providerAmount,
          platformFee: commission,
          completedAt: new Date(),
        },
      });

      return { success: true, awaitingConfirmation: true };
    });
  }

  // --------------------------------------------------
  // Manual confirmation by USER
  // --------------------------------------------------

  async confirmAndRelease(requestId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.findFirst({
        where: {
          id: requestId,
          userId,
          status: RequestStatus.AWAITING_CONFIRMATION,
        },
      });

      if (!request) {
        throw new ForbiddenException('Invalid confirmation state');
      }

      return this.settleFunds(tx, request);
    });
  }

  // --------------------------------------------------
  // Auto confirmation (system)
  // --------------------------------------------------

  async autoConfirmAndRelease(requestId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.findFirst({
        where: {
          id: requestId,
          status: RequestStatus.AWAITING_CONFIRMATION,
        },
      });

      if (!request) return;

      return this.settleFunds(tx, request);
    });
  }

  // --------------------------------------------------
  // CORE settlement logic (single source of truth)
  // --------------------------------------------------

  private async settleFunds(
    tx: Parameters<PrismaService['$transaction']>[0] extends (
      arg: infer T,
    ) => any
      ? T
      : never,
    request: {
      id: string;
      providerId: string | null;
      paymentMode: PaymentMode;
      providerAmount: number;
      platformFee: number;
    },
  ) {
    if (!request.providerId) {
      throw new ForbiddenException('Provider not found');
    }

    if (request.paymentMode === PaymentMode.CASH) {
      await tx.walletTransaction.create({
        data: {
          wallet: { connect: { providerId: request.providerId } },
          type: 'DEBIT',
          amount: request.platformFee,
          reason: 'COMMISSION',
        },
      });
    } else {
      await tx.walletTransaction.create({
        data: {
          wallet: { connect: { providerId: request.providerId } },
          type: 'CREDIT',
          amount: request.providerAmount,
          reason: 'JOB_PAYMENT',
        },
      });
    }

    await tx.serviceRequest.update({
      where: { id: request.id },
      data: { status: RequestStatus.COMPLETED },
    });

    await tx.serviceProvider.update({
      where: { id: request.providerId },
      data: {
        completedJobs: { increment: 1 },
        totalJobs: { increment: 1 },
      },
    });

    if (request.providerId) {
      await this.performanceEngine.adjust(request.providerId, 2);
    }

    return { success: true };
  }
}
