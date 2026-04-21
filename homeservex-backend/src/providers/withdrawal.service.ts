import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus } from '@prisma/client';

@Injectable()
export class WithdrawalService {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------
  // Provider requests withdrawal
  // --------------------------------------------------

  async requestWithdrawal(providerId: string, amount: number) {
    if (amount <= 0) {
      throw new ForbiddenException('Invalid withdrawal amount');
    }

    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        wallet: true,
        riskProfile: true,
        assignedRequests: {
          where: {
            status: RequestStatus.DISPUTED,
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (!provider.isVerified) {
      throw new ForbiddenException('KYC not approved');
    }

    if (!provider.wallet) {
      throw new ForbiddenException('Wallet not found');
    }

    if (provider.wallet.blocked) {
      throw new ForbiddenException('Wallet blocked');
    }

    if (provider.riskProfile?.flagged) {
      throw new ForbiddenException('Withdrawal restricted due to risk review');
    }

    if (provider.assignedRequests.length > 0) {
      throw new ForbiddenException('Cannot withdraw with active disputes');
    }

    if (provider.wallet.balance < amount) {
      throw new ForbiddenException('Insufficient balance');
    }

    return this.prisma.$transaction(async (tx) => {
      // Deduct balance
      await tx.providerWallet.update({
        where: { providerId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      // Create payout request
      await tx.providerPayout.create({
        data: {
          providerId,
          amount,
          status: 'PENDING',
        },
      });

      return { success: true };
    });
  }

  // --------------------------------------------------
  // Get withdrawal history
  // --------------------------------------------------

  async getWithdrawals(providerId: string) {
    return this.prisma.providerPayout.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
