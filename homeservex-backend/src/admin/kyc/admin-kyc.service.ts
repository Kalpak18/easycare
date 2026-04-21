import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentStatus, OnboardingStep } from '@prisma/client';

@Injectable()
export class AdminKycService {
  constructor(private prisma: PrismaService) {}

  async getPendingProviders() {
    const providers = await this.prisma.serviceProvider.findMany({
      where: {
        documents: { some: { status: 'PENDING' } },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        isVerified: true,
        documents: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            status: true,
            fileUrl: true,
            rejectionReason: true,
          },
        },
      },
    });

    return providers.map((p) => ({
      providerId: p.id,
      name: p.name,
      phone: p.phone,
      isVerified: p.isVerified,
      pendingCount: p.documents.filter((d) => d.status === 'PENDING').length,
      documents: p.documents,
    }));
  }

  async getProviderDocuments(providerId: string) {
    return this.prisma.providerDocument.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveDocument(documentId: string) {
    const doc = await this.prisma.providerDocument.update({
      where: { id: documentId },
      data: { status: DocumentStatus.APPROVED },
    });

    await this.recalculateProviderVerification(doc.providerId);
    return doc;
  }

  async rejectDocument(documentId: string, reason: string) {
    const doc = await this.prisma.providerDocument.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.REJECTED,
        rejectionReason: reason,
      },
    });

    await this.recalculateProviderVerification(doc.providerId);
    return doc;
  }

  private async recalculateProviderVerification(providerId: string) {
    const docs = await this.prisma.providerDocument.findMany({
      where: { providerId },
    });

    const required = [
      'PROFILE_PHOTO',
      'ID_PROOF',
      'ADDRESS_PROOF',
      'BANK_DETAILS',
    ];

    let verified = true;

    for (const type of required) {
      const doc = docs.find((d) => d.type === type);
      if (!doc || doc.status !== 'APPROVED') {
        verified = false;
        break;
      }
    }

    await this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: {
        isVerified: verified,
        onboardingStep: verified ? OnboardingStep.KYC_APPROVED : OnboardingStep.KYC_REJECTED,
      },
    });
  }
}
