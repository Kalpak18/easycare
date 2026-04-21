/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from 'src/providers/providers.service';
import { KycEngineService } from '../providers/kyc-engine.service';
import { Payment } from '@prisma/client';
import { PaymentEngineService } from 'src/payments/payment-engine.service';
import { RiskEngineService } from 'src/providers/risk-engine.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    private kycEngineService: KycEngineService,
    private paymentEngine: PaymentEngineService,
    private riskEngine: RiskEngineService,
  ) {}

  async verifyProvider(providerId: string) {
    return this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: { isVerified: true },
    });
  }

  async blockProvider(providerId: string) {
    return this.prisma.providerWallet.update({
      where: { providerId },
      data: { blocked: true },
    });
  }

  async unblockProvider(providerId: string) {
    return this.prisma.providerWallet.update({
      where: { providerId },
      data: { blocked: false },
    });
  }

  async setCommission(categoryId: string, percentage: number) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.commissionRule.upsert({
      where: { categoryId },
      update: { percentage },
      create: {
        categoryId,
        percentage,
      },
    });
  }
  async approveDocument(documentId: string) {
    const doc = await this.prisma.providerDocument.update({
      where: { id: documentId },
      data: { status: 'APPROVED', rejectionReason: null },
    });

    await this.kycEngineService.evaluateKyc(doc.providerId);

    return { success: true };
  }

  async rejectDocument(documentId: string, reason: string) {
    const doc = await this.prisma.providerDocument.update({
      where: { id: documentId },
      data: { status: 'REJECTED', rejectionReason: reason },
    });

    return { success: true };
  }
  async processPayout(payoutId: string) {
    return this.prisma.providerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });
  }

  async resolveDispute(
    disputeId: string,
    releaseToProvider: boolean,
    note: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { request: true },
    });

    if (!dispute || dispute.status !== 'OPEN') {
      throw new Error('Invalid dispute');
    }

    if (releaseToProvider) {
      await this.paymentEngine.autoConfirmAndRelease(dispute.requestId);
    } else {
      await this.prisma.serviceRequest.update({
        where: { id: dispute.requestId },
        data: { status: 'CANCELLED' },
      });
    }

    await this.riskEngine.evaluate(dispute.providerId);

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: releaseToProvider ? 'RESOLVED_PROVIDER' : 'RESOLVED_USER',
        adminNote: note,
        resolvedAt: new Date(),
      },
    });
  }
}
