import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingStep } from '@prisma/client';

@Injectable()
export class PayoutEngineService {
  constructor(private prisma: PrismaService) {}

  async requestWithdrawal(providerId: string, amount: number) {
    if (amount <= 0) {
      throw new ForbiddenException('Invalid withdrawal amount');
    }

    return this.prisma.$transaction(async (tx) => {
      const provider = await tx.serviceProvider.findUnique({
        where: { id: providerId },
        include: { wallet: true },
      });

      if (!provider || !provider.wallet) {
        throw new ForbiddenException('Wallet not found');
      }

      // 🔒 Must be KYC approved
      if (
        !provider.isVerified ||
        provider.onboardingStep !== OnboardingStep.KYC_APPROVED
      ) {
        throw new ForbiddenException('Complete KYC before withdrawal');
      }

      if (provider.wallet.blocked) {
        throw new ForbiddenException('Wallet is blocked');
      }

      if (provider.wallet.balance < amount) {
        throw new ForbiddenException('Insufficient balance');
      }

      // Deduct balance
      await tx.providerWallet.update({
        where: { providerId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      // Create payout record
      const payout = await tx.providerPayout.create({
        data: {
          providerId,
          amount,
          status: 'PENDING',
        },
      });

      return payout;
    });
  }

  async markPayoutProcessed(payoutId: string) {
    return this.prisma.providerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });
  }
}
