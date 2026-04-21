/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnboardingStep } from '@prisma/client';

@Injectable()
export class ProviderOnboardingGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const providerId = request.user?.userId;

    if (!providerId) {
      return false;
    }

    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      select: { onboardingStep: true, isVerified: true },
    });

    if (!provider) {
      return false;
    }

    // Allow if KYC is approved — either via onboardingStep OR isVerified flag
    // isVerified is the source of truth; onboardingStep may lag for older records
    const isApproved =
      provider.isVerified ||
      provider.onboardingStep === OnboardingStep.KYC_APPROVED;

    if (!isApproved) {
      throw new ForbiddenException({
        code: 'ONBOARDING_INCOMPLETE',
        message: 'Complete KYC to access this feature',
        currentStep: provider.onboardingStep,
      });
    }

    return true;
  }
}
