import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingStep } from '@prisma/client';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------
  // INITIALIZE ONBOARDING
  // ----------------------------------------

  async initialize(providerId: string) {
    const existing = await this.prisma.providerOnboardingProgress.findUnique({
      where: { providerId },
    });

    if (existing) return existing;

    return this.prisma.providerOnboardingProgress.create({
      data: {
        providerId,
        currentStep: OnboardingStep.PHONE_VERIFIED,
        completedSteps: [],
      },
    });
  }

  // ----------------------------------------
  // MOVE TO STEP
  // ----------------------------------------

  async moveToStep(providerId: string, step: OnboardingStep) {
    await this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: { onboardingStep: step },
    });

    await this.prisma.providerOnboardingProgress.upsert({
      where: { providerId },
      update: { currentStep: step },
      create: { providerId, currentStep: step, completedSteps: [] },
    });
  }

  // ----------------------------------------
  // MARK STEP COMPLETED (NEW)
  // ----------------------------------------

  async markStepCompleted(providerId: string, step: OnboardingStep) {
    const progress = await this.prisma.providerOnboardingProgress.findUnique({
      where: { providerId },
    });

    if (!progress) return;

    const updatedSteps = Array.from(
      new Set([...progress.completedSteps, step]),
    );

    await this.prisma.providerOnboardingProgress.update({
      where: { providerId },
      data: {
        completedSteps: updatedSteps,
      },
    });
  }
}
