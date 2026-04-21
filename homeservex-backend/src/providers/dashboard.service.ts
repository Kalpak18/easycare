import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async buildDashboard(providerId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        wallet: true,
        documents: true,
        onboardingProgress: true,
        riskProfile: true,
        category: {
          include: { kycRequirements: true },
        },
      },
    });

    if (!provider) return null;

    const requiredDocs = provider.category.kycRequirements
      .filter((r) => r.isMandatory)
      .map((r) => r.documentType);

    const uploadedDocs = provider.documents.map((d) => d.type);

    const missingDocs = requiredDocs.filter(
      (type) => !uploadedDocs.includes(type),
    );

    const kycApproved = provider.documents.every(
      (d) => d.status === DocumentStatus.APPROVED,
    );

    const canGoOnline =
      provider.isVerified &&
      !provider.wallet?.blocked &&
      provider.wallet?.balance !== undefined &&
      provider.wallet.balance >= -500;

    return {
      profile: {
        id: provider.id,
        name: provider.name,
        rating: provider.rating,
        completedJobs: provider.completedJobs,
      },

      onboarding: {
        currentStep: provider.onboardingStep,
        completedSteps: provider.onboardingProgress?.completedSteps || [],
      },

      kyc: {
        approved: kycApproved,
        requiredDocs,
        uploadedDocs,
        missingDocs,
      },

      wallet: {
        balance: provider.wallet?.balance ?? 0,
        blocked: provider.wallet?.blocked ?? false,
      },

      eligibility: {
        canGoOnline,
        reasonIfBlocked: canGoOnline
          ? null
          : 'Complete KYC / Clear dues / Wait for approval',
      },

      risk: {
        score: provider.riskProfile?.riskScore ?? 0,
        flagged: provider.riskProfile?.flagged ?? false,
      },
    };
  }
}
