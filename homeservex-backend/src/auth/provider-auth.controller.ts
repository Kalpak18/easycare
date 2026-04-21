import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ProviderAuthService } from './provider-auth.service';
import { Public } from './public.decorator';

@Controller('auth/provider')
export class ProviderAuthController {
  constructor(private providerAuthService: ProviderAuthService) {}

  // ── Phone OTP ─────────────────────────────────────────
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('send-otp')
  sendOtp(@Body() body: { phone: string }) {
    return this.providerAuthService.sendOtp(body.phone);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('verify-otp')
  verifyOtp(@Body() body: { phone: string; otp: string }) {
    return this.providerAuthService.verifyOtp(body.phone, body.otp);
  }

  @Public()
  @Post('complete-profile')
  completeProfile(@Body() body: { phone: string; name: string; categoryId: string; email?: string }) {
    return this.providerAuthService.completeProfile(body);
  }

  // ── Email OTP ─────────────────────────────────────────
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('send-otp-email')
  sendOtpEmail(@Body() body: { email: string }) {
    return this.providerAuthService.sendOtpEmail(body.email);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('verify-otp-email')
  verifyOtpEmail(@Body() body: { email: string; otp: string }) {
    return this.providerAuthService.verifyOtpEmail(body.email, body.otp);
  }

  @Public()
  @Post('complete-profile-email')
  completeProfileEmail(@Body() body: { email: string; name: string; phone: string; categoryId: string }) {
    return this.providerAuthService.completeProfileEmail(body);
  }
}
