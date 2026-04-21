import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { KycPolicyService } from './kyc-policy.service';
import { OnboardingService } from './onboarding.service';
import { KycEngineService } from './kyc-engine.service';
import { DashboardService } from './dashboard.service';
import { RiskEngineService } from './risk-engine.service';
import { PayoutEngineService } from './payout-engine.service';
import { WithdrawalService } from './withdrawal.service';
import { WithdrawalController } from './withdrawal.controller';
import { AutoOfflineService } from './auto-offline.service';
import { PerformanceEngineService } from './performance-engine.service';

@Module({
  imports: [PrismaModule],
  providers: [
    ProvidersService,
    KycPolicyService,
    OnboardingService,
    KycEngineService,
    DashboardService,
    RiskEngineService,
    PayoutEngineService,
    WithdrawalService,
    AutoOfflineService,
    PerformanceEngineService,
  ],
  controllers: [ProvidersController, WithdrawalController],
  exports: [
    ProvidersService,
    OnboardingService,
    KycEngineService,
    PayoutEngineService,
    RiskEngineService,
    PerformanceEngineService,
  ],
})
export class ProvidersModule {}
