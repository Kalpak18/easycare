/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { calculateCommission } from './commission.util';
import { PaymentMode, PaymentStatus, WalletReason } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private walletsService: WalletsService,
  ) {}

  verifyWebhook(payload: any) {
    // TODO: Razorpay / PhonePe later
    return true;
  }

  async completeJob(requestId: string, totalAmount: number) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.findUnique({
        where: { id: requestId },
        include: {
          provider: { include: { wallet: true } },
          category: { include: { commissionRules: true } },
        },
      });

      if (!request || !request.provider) {
        throw new ForbiddenException('Invalid request');
      }

      if (request.status !== 'ASSIGNED') {
        throw new ForbiddenException('Job not in progress');
      }

      const commissionPercent =
        request.category.commissionRules[0]?.percentage ?? 10;

      const { platformFee, providerAmount } = calculateCommission(
        totalAmount,
        commissionPercent,
      );

      // 1️⃣ Create payment record
      await tx.payment.create({
        data: {
          requestId,
          mode: request.paymentMode,
          status: PaymentStatus.PAID,
          amount: totalAmount,
          platformFee,
          providerAmount,
        },
      });

      // 2️⃣ Wallet logic
      if (request.paymentMode === PaymentMode.CASH) {
        // Provider owes commission
        await this.walletsService.debit(
          request.providerId!,
          platformFee,
          WalletReason.COMMISSION,
        );
      } else {
        // Platform received → provider earns
        await this.walletsService.credit(
          request.providerId!,
          providerAmount,
          WalletReason.JOB_PAYMENT,
        );
      }

      // 3️⃣ Update request
      await tx.serviceRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          totalAmount,
          providerAmount,
          platformFee,
        },
      });

      return { success: true };
    });
  }
}
