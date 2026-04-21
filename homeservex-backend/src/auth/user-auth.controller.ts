import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserAuthService } from './user-auth.service';
import { Public } from './public.decorator';

@Controller('auth/user')
export class UserAuthController {
  constructor(private userAuthService: UserAuthService) {}

  // ── Phone OTP ─────────────────────────────────────────
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 OTP requests per minute per IP
  @Post('send-otp')
  sendOtp(@Body() body: { phone: string }) {
    return this.userAuthService.sendOtp(body.phone);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 verify attempts per minute per IP
  @Post('verify-otp')
  verifyOtp(@Body() body: { phone: string; otp: string }) {
    return this.userAuthService.verifyOtp(body.phone, body.otp);
  }

  @Public()
  @Post('complete-profile')
  completeProfile(@Body() body: { phone: string; name: string; email?: string }) {
    return this.userAuthService.completeProfile(body);
  }

  // ── Email OTP ─────────────────────────────────────────
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('send-otp-email')
  sendOtpEmail(@Body() body: { email: string }) {
    return this.userAuthService.sendOtpEmail(body.email);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('verify-otp-email')
  verifyOtpEmail(@Body() body: { email: string; otp: string }) {
    return this.userAuthService.verifyOtpEmail(body.email, body.otp);
  }

  @Public()
  @Post('complete-profile-email')
  completeProfileEmail(@Body() body: { email: string; name: string; phone: string }) {
    return this.userAuthService.completeProfileEmail(body);
  }
}
