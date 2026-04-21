import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminFinanceService {
  constructor(private prisma: PrismaService) {}

  listWallets() {
    return this.prisma.providerWallet.findMany({
      include: {
        provider: { select: { name: true, phone: true } },
      },
      orderBy: { balance: 'desc' },
    });
  }

  upsertCommission(categoryId: string, percentage: number) {
    return this.prisma.commissionRule.upsert({
      where: { categoryId },
      update: { percentage },
      create: { categoryId, percentage },
    });
  }
}
