import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStatus, RequestStatus } from '@prisma/client';

@Injectable()
export class RiskEngineService {
  constructor(private prisma: PrismaService) {}

  async evaluate(providerId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        documents: true,
        assignedRequests: {
          include: { dispute: true },
        },
        wallet: true,
      },
    });

    if (!provider) return;

    let riskScore = 0;
    let reason = '';

    // 🔴 Rejected documents
    const rejectedDocs = provider.documents.filter(
      (d) => d.status === DocumentStatus.REJECTED,
    );

    if (rejectedDocs.length > 0) {
      riskScore += 20;
      reason += 'Rejected documents. ';
    }

    // 🔴 Low rating
    if (provider.rating < 2.5 && provider.completedJobs > 5) {
      riskScore += 30;
      reason += 'Low rating. ';
    }

    // 🔴 High cancellations
    const cancelled = provider.assignedRequests.filter(
      (r) => r.status === RequestStatus.CANCELLED,
    );

    if (cancelled.length > 5) {
      riskScore += 25;
      reason += 'Too many cancellations. ';
    }

    // 🔴 Too many disputes
    const disputes = provider.assignedRequests.filter(
      (r) => r.dispute !== null,
    );

    if (disputes.length > 3) {
      riskScore += 30;
      reason += 'Frequent disputes. ';
    }

    // 🔴 Suspicious wallet balance
    if (provider.wallet && provider.wallet.balance < -1000) {
      riskScore += 25;
      reason += 'High dues. ';
    }

    const flagged = riskScore >= 70;

    await this.prisma.providerRiskProfile.upsert({
      where: { providerId },
      update: {
        riskScore,
        flagged,
        reason,
      },
      create: {
        providerId,
        riskScore,
        flagged,
        reason,
      },
    });

    // -------------------------------------------------
    // 🚨 ENFORCEMENT LAYER
    // -------------------------------------------------

    if (flagged) {
      // 1️⃣ Force offline
      await this.prisma.serviceProvider.update({
        where: { id: providerId },
        data: { isOnline: false },
      });

      // 2️⃣ Block wallet
      await this.prisma.providerWallet.update({
        where: { providerId },
        data: { blocked: true },
      });
    } else {
      // If risk improves → restore
      await this.prisma.providerWallet.update({
        where: { providerId },
        data: { blocked: false },
      });
    }
  }
}
