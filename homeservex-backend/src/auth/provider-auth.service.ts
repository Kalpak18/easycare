import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { SmsService } from '../common/sms/sms.service';
import { EmailService } from '../common/email/email.service';
import { Role } from '@prisma/client';

@Injectable()
export class ProviderAuthService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private smsService: SmsService,
    private emailService: EmailService,
  ) {}

  // ─── PHONE FLOW (Twilio Verify — no DB OTP storage) ──────────

  async sendOtp(phone: string) {
    await this.smsService.sendOtp(phone.trim());
    return { success: true };
  }

  async verifyOtp(phone: string, otp: string) {
    const normalized = phone.trim();

    // Twilio Verify handles the check — throws if invalid
    await this.smsService.verifyOtp(normalized, otp);

    const existing = await this.prisma.serviceProvider.findUnique({ where: { phone: normalized } });
    if (!existing) return { requiresProfile: true };

    return this.authService.issueTokens({ providerId: existing.id, role: Role.PROVIDER });
  }

  /** Phone flow profile completion — collects name + categoryId + optional email */
  async completeProfile(body: { phone: string; name: string; categoryId: string; email?: string }) {
    const provider = await this.prisma.serviceProvider.create({
      data: {
        phone: body.phone.trim(),
        name: body.name.trim(),
        email: body.email?.trim().toLowerCase() || null,
        categoryId: body.categoryId,
        role: Role.PROVIDER,
        isVerified: false,
        isOnline: false,
        wallet: { create: { balance: 0, blocked: false } },
      },
    });
    return this.authService.issueTokens({ providerId: provider.id, role: Role.PROVIDER });
  }

  // ─── EMAIL FLOW (DB-backed OTP via nodemailer) ────────────────

  async sendOtpEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const otp = this.smsService.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.otp.upsert({
      where: { email: normalized },
      update: { code: otp, expiresAt },
      create: { email: normalized, code: otp, expiresAt },
    });

    await this.emailService.sendOtp(normalized, otp);
    return { success: true };
  }

  async verifyOtpEmail(email: string, otp: string) {
    const normalized = email.trim().toLowerCase();

    const record = await this.prisma.otp.findUnique({ where: { email: normalized } });
    if (!record) throw new UnauthorizedException('OTP not found');
    if (record.expiresAt < new Date()) throw new UnauthorizedException('OTP expired');
    if (record.code !== otp) throw new UnauthorizedException('Invalid OTP');

    await this.prisma.otp.delete({ where: { email: normalized } });

    const existing = await this.prisma.serviceProvider.findUnique({ where: { email: normalized } });
    if (!existing) return { requiresProfile: true };

    return this.authService.issueTokens({ providerId: existing.id, role: Role.PROVIDER });
  }

  /** Email flow profile completion — collects name + phone (required) + categoryId */
  async completeProfileEmail(body: { email: string; name: string; phone: string; categoryId: string }) {
    const provider = await this.prisma.serviceProvider.create({
      data: {
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        name: body.name.trim(),
        categoryId: body.categoryId,
        role: Role.PROVIDER,
        isVerified: false,
        isOnline: false,
        wallet: { create: { balance: 0, blocked: false } },
      },
    });
    return this.authService.issueTokens({ providerId: provider.id, role: Role.PROVIDER });
  }
}
