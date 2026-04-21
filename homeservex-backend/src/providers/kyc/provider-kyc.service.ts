import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProviderDocumentType } from '@prisma/client';

@Injectable()
export class ProviderKycService {
  constructor(private prisma: PrismaService) {}

  async uploadDocument(
    providerId: string,
    type: ProviderDocumentType,
    fileUrl: string,
  ) {
    return this.prisma.providerDocument.upsert({
      where: {
        providerId_type: { providerId, type },
      },
      update: {
        fileUrl,
        status: 'PENDING',
        rejectionReason: null,
      },
      create: {
        providerId,
        type,
        fileUrl,
      },
    });
  }

  async getDocuments(providerId: string) {
    return this.prisma.providerDocument.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getKycStatus(providerId: string) {
    const docs = await this.prisma.providerDocument.findMany({
      where: { providerId },
    });

    const required = [
      'PROFILE_PHOTO',
      'ID_PROOF',
      'ADDRESS_PROOF',
      'BANK_DETAILS',
    ];

    let overall: 'PENDING' | 'APPROVED' | 'REJECTED' = 'APPROVED';

    for (const type of required) {
      const doc = docs.find((d) => d.type === type);
      if (!doc || doc.status === 'PENDING') {
        overall = 'PENDING';
        break;
      }
      if (doc.status === 'REJECTED') {
        overall = 'REJECTED';
        break;
      }
    }

    return { overallStatus: overall, documents: docs };
  }
}
