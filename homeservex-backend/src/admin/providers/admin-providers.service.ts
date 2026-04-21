import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnboardingStep } from '@prisma/client';

@Injectable()
export class AdminProvidersService {
  constructor(private prisma: PrismaService) {}

  async listProviders() {
    return this.prisma.serviceProvider.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        wallet: { select: { balance: true, blocked: true } },
        _count: { select: { assignedRequests: true } },
      },
    });
  }

  async getProvider(id: string) {
    return this.prisma.serviceProvider.findUniqueOrThrow({
      where: { id },
      include: {
        category: { select: { name: true } },
        wallet: { select: { balance: true, blocked: true } },
        documents: { orderBy: { createdAt: 'desc' } },
        _count: { select: { assignedRequests: true } },
      },
    });
  }

  async verifyProvider(providerId: string) {
    const pending = await this.prisma.providerDocument.findMany({
      where: {
        providerId,
        status: { not: 'APPROVED' },
      },
    });

    if (pending.length > 0) {
      throw new Error('All documents must be approved');
    }

    await this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: { isVerified: true, onboardingStep: OnboardingStep.KYC_APPROVED },
    });

    await this.prisma.notification.create({
      data: {
        recipientId: providerId,
        recipientRole: 'PROVIDER',
        message: '🎉 Your account is verified. You can now go online!',
      },
    });

    return { success: true };
  }

  async blockProvider(id: string) {
    return this.prisma.providerWallet.update({
      where: { providerId: id },
      data: { blocked: true },
    });
  }

  async unblockProvider(providerId: string) {
    return this.prisma.providerWallet.update({
      where: { providerId },
      data: { blocked: false },
    });
  }

  async approveDocument(docId: string) {
    return this.prisma.providerDocument.update({
      where: { id: docId },
      data: { status: 'APPROVED', rejectionReason: null },
    });
  }

  async rejectDocument(docId: string, reason: string) {
    return this.prisma.providerDocument.update({
      where: { id: docId },
      data: { status: 'REJECTED', rejectionReason: reason },
    });
  }

  async createCompanyWorker(data: {
    name: string;
    phone: string;
    categoryId: string;
    city?: string;
    state?: string;
  }) {
    return this.prisma.serviceProvider.create({
      data: {
        name: data.name,
        phone: data.phone,
        categoryId: data.categoryId,
        city: data.city,
        state: data.state,
        role: 'PROVIDER',
        source: 'COMPANY',
        isVerified: true,
        onboardingStep: OnboardingStep.KYC_APPROVED,
        isOnline: false,
        wallet: { create: { balance: 0, blocked: false } },
      },
      include: { category: { select: { name: true } } },
    });
  }
}
