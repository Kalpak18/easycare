import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletTransactionType, WalletReason } from '@prisma/client';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async credit(providerId: string, amount: number, reason: WalletReason) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.providerWallet.update({
        where: { providerId },
        data: {
          balance: { increment: amount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: WalletTransactionType.CREDIT,
          reason,
        },
      });

      return wallet;
    });
  }

  async debit(providerId: string, amount: number, reason: WalletReason) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.providerWallet.update({
        where: { providerId },
        data: {
          balance: { decrement: amount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: WalletTransactionType.DEBIT,
          reason,
        },
      });

      return wallet;
    });
  }
  async getWalletWithTransactions(providerId: string) {
    return this.prisma.providerWallet.findUnique({
      where: { providerId },
      select: {
        balance: true,
        blocked: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            amount: true,
            type: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });
  }
}
