import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private get client() {
    return twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  private get serviceSid() {
    return process.env.TWILIO_VERIFY_SERVICE_SID!;
  }

  private get isConfigured() {
    return !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID
    );
  }

  /** Ensure E.164 format: +91XXXXXXXXXX */
  private toE164(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (phone.startsWith('+')) return phone;
    if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
    return `+91${digits}`;
  }

  /**
   * Send OTP via Twilio Verify.
   * Twilio generates and delivers the OTP — no DB storage needed.
   * Falls back to console log in dev if credentials absent.
   */
  async sendOtp(phone: string): Promise<void> {
    const to = this.toE164(phone);

    if (!this.isConfigured) {
      this.logger.warn(`[DEV SMS OTP] Twilio not configured. Skipping SMS to ${to}`);
      return;
    }

    try {
      await this.client.verify.v2
        .services(this.serviceSid)
        .verifications.create({ to, channel: 'sms' });

      this.logger.log(`Twilio Verify OTP sent to ${to}`);
    } catch (err) {
      this.logger.error(
        `Failed to send Twilio OTP to ${to}:`,
        err instanceof Error ? err.message : err,
      );
      throw new Error('Failed to send OTP via SMS. Please try again.');
    }
  }

  /**
   * Verify OTP code with Twilio Verify.
   * Returns true if valid, throws UnauthorizedException if not.
   */
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const to = this.toE164(phone);

    if (!this.isConfigured) {
      this.logger.warn(`[DEV SMS VERIFY] Twilio not configured. Accepting any OTP for ${to}`);
      return true; // dev pass-through
    }

    try {
      const check = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks.create({ to, code });

      if (check.status !== 'approved') {
        throw new UnauthorizedException('Invalid or expired OTP');
      }
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error(
        `Twilio verify check failed for ${to}:`,
        err instanceof Error ? err.message : err,
      );
      throw new UnauthorizedException('Invalid or expired OTP');
    }
  }

  /** Generate a random 6-digit code (used for email OTP only — DB-backed) */
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
