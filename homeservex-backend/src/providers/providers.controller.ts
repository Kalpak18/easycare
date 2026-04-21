import {
  Controller,
  Post,
  Patch,
  Req,
  Get,
  Query,
  UnauthorizedException,
  NotFoundException,
  Body,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { UploadKycDto } from './dto/upload-kyc.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Roles } from '../auth/roles.decorator';
import { OnboardingStep, Role } from '@prisma/client';
import type { AuthRequest } from '../auth/types/auth-request.type';
import { KycEngineService } from './kyc-engine.service';
import { PayoutEngineService } from './payout-engine.service';
import { OnboardingService } from './onboarding.service';
import { DashboardService } from './dashboard.service';
import { UseGuards } from '@nestjs/common';
import { ProviderOnboardingGuard } from './guards/provider-onboarding.guard';
import { uploadToCloudinary } from '../common/cloudinary/cloudinary.service';

@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly providersService: ProvidersService,
    private readonly kycEngineService: KycEngineService,
    private readonly onboardingService: OnboardingService,
    private readonly dashboardService: DashboardService,
    private readonly payoutEngineService: PayoutEngineService,
  ) {}

  // ---------------- KYC ----------------

  @Roles(Role.PROVIDER)
  @Post('kyc/upload')
uploadKyc(@Req() req: AuthRequest, @Body() dto: UploadKycDto) {
  console.log("DTO RECEIVED:", dto);

  return this.providersService.upsertKycDocument(
    req.user.userId,
    dto.type,
    dto.fileUrl,
  );
}

  @Roles(Role.PROVIDER)
  @Post('kyc/upload-file')
  async uploadFile(@Body() body: { image: string }) {
  const url = await uploadToCloudinary(body.image);

  return { fileUrl: url };
 }

  @Roles(Role.PROVIDER)
  @Get('kyc/status')
  getKycStatus(@Req() req: AuthRequest) {
    return this.providersService.getKycStatus(req.user.userId);
  }

  @Roles(Role.PROVIDER)
  @Get('kyc/documents')
  getMyDocuments(@Req() req: AuthRequest) {
    return this.providersService.getProviderDocuments(req.user.userId);
  }

  @Roles(Role.PROVIDER)
  @Post('kyc/submit')
  submitKyc(@Req() req: AuthRequest) {
    return this.kycEngineService.submitKyc(req.user.userId);
  }

  // ---------------- ONLINE ----------------

  @Roles(Role.PROVIDER)
  @UseGuards(ProviderOnboardingGuard)
  @Patch('online')
  goOnline(@Req() req: AuthRequest) {
    return this.providersService.setOnline(req.user.userId, true);
  }

  @Roles(Role.PROVIDER)
  @Patch('offline')
  goOffline(@Req() req: AuthRequest) {
    return this.providersService.setOnline(req.user.userId, false);
  }

  // ---------------- PROFILE ----------------

  @Roles(Role.PROVIDER)
  @Get('me')
  async getMyProfile(@Req() req: AuthRequest) {
    const provider = await this.providersService.getProfile(req.user.userId);

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const isKycComplete = await this.providersService.isKycComplete(
      provider.id,
    );

    if (req.user.isVerified === false && provider.isVerified === true) {
      throw new UnauthorizedException({
        code: 'TOKEN_STALE',
        message: 'Verification updated, refresh token required',
      });
    }

    return {
      ...provider,
      isKycComplete,
    };
  }

  // ---------------- JOBS ----------------

  @Roles(Role.PROVIDER)
  @UseGuards(ProviderOnboardingGuard)
  @Get('jobs')
  getProviderJobs(@Req() req: AuthRequest) {
    return this.dashboardService.buildDashboard(req.user.userId);
  }

  // ---------------- DASHBOARD ----------------

  @Roles(Role.PROVIDER)
  @Get('dashboard')
  async dashboard(@Req() req: AuthRequest) {
    const profile = await this.providersService.getProfile(req.user.userId);

    if (!profile) {
      throw new NotFoundException('Provider not found');
    }

    const jobs = await this.providersService.getProviderJobs(req.user.userId);

    const activeJobs = jobs.filter((j) => j.status !== 'COMPLETED');

    const todayEarnings = jobs
      .filter(
        (j) =>
          j.status === 'COMPLETED' &&
          j.completedAt &&
          new Date(j.completedAt).toDateString() === new Date().toDateString(),
      )
      .reduce((sum, j) => sum + j.providerAmount, 0);

    return {
      profile,
      wallet: profile.wallet,
      activeJobs,
      todayEarnings,
    };
  }

  // ---------------- NEARBY ----------------

  @Roles(Role.USER)
  @Get('nearby')
  getNearby(
    @Query('categoryId') categoryId: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
    @Query('source') source?: 'MARKETPLACE' | 'COMPANY',
  ) {
    return this.providersService.getNearbyProviders(
      categoryId,
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : 10,
      source,
    );
  }

  @Roles(Role.PROVIDER)
  @Post('initialize-onboarding')
  async initializeOnboarding(@Req() req: AuthRequest) {
    await this.onboardingService.initialize(req.user.userId);
    await this.onboardingService.moveToStep(
      req.user.userId,
      OnboardingStep.PROFILE_COMPLETED,
    );

    return { success: true };
  }
  @Roles(Role.PROVIDER)
  @Post('wallet/withdraw')
  requestWithdrawal(@Req() req: AuthRequest, @Body() body: { amount: number }) {
    return this.payoutEngineService.requestWithdrawal(
      req.user.userId,
      body.amount,
    );
  }
  @Roles(Role.PROVIDER)
  @Post('location')
  updateLocation(@Req() req: AuthRequest, @Body() dto: UpdateLocationDto) {
    const providerId = req.user.userId;

    return this.providersService.updateLocation(
      providerId,
      dto.latitude,
      dto.longitude,
    );
  }
}
