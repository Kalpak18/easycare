import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { SmsService } from '../common/sms/sms.service';
import { EmailService } from '../common/email/email.service';
import { Role } from '@prisma/client';

@Injectable()
export class UserAuthService {
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

    const existing = await this.prisma.user.findUnique({ where: { phone: normalized } });
    if (!existing) return { requiresProfile: true };

    return this.authService.issueTokens({ userId: existing.id, role: Role.USER });
  }

  /** Phone flow profile completion — collects name + optional email */
  async completeProfile(body: { phone: string; name: string; email?: string }) {
    const user = await this.prisma.user.create({
      data: {
        phone: body.phone.trim(),
        name: body.name.trim(),
        email: body.email?.trim().toLowerCase() || null,
        role: Role.USER,
      },
    });
    return this.authService.issueTokens({ userId: user.id, role: Role.USER });
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

    const existing = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (!existing) return { requiresProfile: true };

    return this.authService.issueTokens({ userId: existing.id, role: Role.USER });
  }

  /** Email flow profile completion — collects name + phone (required) */
  async completeProfileEmail(body: { email: string; name: string; phone: string }) {
    const user = await this.prisma.user.create({
      data: {
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        name: body.name.trim(),
        role: Role.USER,
      },
    });
    return this.authService.issueTokens({ userId: user.id, role: Role.USER });
  }
}
