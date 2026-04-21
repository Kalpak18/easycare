import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStatus, OnboardingStep } from '@prisma/client';
import { OnboardingService } from './onboarding.service';
import { RiskEngineService } from './risk-engine.service';

@Injectable()
export class KycEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private riskEngineService: RiskEngineService,
    private readonly onboardingService: OnboardingService,
  ) {}

  // -----------------------------------------
  // VALIDATE REQUIRED DOCUMENTS (Category-based)
  // -----------------------------------------

  async validateRequiredDocuments(providerId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        category: {
          include: { kycRequirements: true },
        },
        documents: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const mandatoryDocs = provider.category.kycRequirements
      .filter((r) => r.isMandatory)
      .map((r) => r.documentType);

    const uploadedTypes = provider.documents.map((d) => d.type);

    const missing = mandatoryDocs.filter(
      (type) => !uploadedTypes.includes(type),
    );

    if (missing.length > 0) {
      throw new ForbiddenException({
        message: 'Missing required documents',
        missing,
      });
    }

    return true;
  }

  // -----------------------------------------
  // SUBMIT KYC
  // -----------------------------------------

  async submitKyc(providerId: string) {
    await this.validateRequiredDocuments(providerId);

    await this.onboardingService.moveToStep(
      providerId,
      OnboardingStep.KYC_SUBMITTED,
    );

    return { success: true };
  }

  // -----------------------------------------
  // AUTO EVALUATE KYC (Admin Approval Trigger)
  // -----------------------------------------

  async evaluateKyc(providerId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        category: {
          include: { kycRequirements: true },
        },
        documents: true,
      },
    });

    if (!provider) return;

    const mandatoryDocs = provider.category.kycRequirements
      .filter((r) => r.isMandatory)
      .map((r) => r.documentType);

    const uploadedDocs = provider.documents;

    // 🚫 If any rejected → immediate reject
    const hasRejected = uploadedDocs.some(
      (d) => d.status === DocumentStatus.REJECTED,
    );

    if (hasRejected) {
      await this.onboardingService.moveToStep(
        providerId,
        OnboardingStep.KYC_REJECTED,
      );

      await this.riskEngineService.evaluate(providerId); // Flag for review

      return;
    }

    // 🚫 Ensure all mandatory docs exist
    const uploadedTypes = uploadedDocs.map((d) => d.type);

    const missingMandatory = mandatoryDocs.filter(
      (type) => !uploadedTypes.includes(type),
    );

    if (missingMandatory.length > 0) {
      return; // Not complete yet
    }

    // 🚫 Ensure all mandatory docs are approved
    const mandatoryApproved = mandatoryDocs.every((type) =>
      uploadedDocs.some(
        (d) => d.type === type && d.status === DocumentStatus.APPROVED,
      ),
    );

    if (!mandatoryApproved) {
      return;
    }

    // ✅ Everything approved
    await this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: {
        isVerified: true,
        onboardingStep: OnboardingStep.KYC_APPROVED,
      },
    });

    await this.onboardingService.markStepCompleted(
      providerId,
      OnboardingStep.KYC_APPROVED,
    );

    await this.riskEngineService.evaluate(providerId); // Final risk evaluation
  }
}
