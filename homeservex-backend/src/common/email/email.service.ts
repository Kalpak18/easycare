import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /** Send OTP via Gmail SMTP. Falls back to console log in dev if credentials absent. */
  async sendOtp(email: string, otp: string): Promise<void> {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      this.logger.warn(`[DEV EMAIL OTP] Email: ${email} | OTP: ${otp}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    try {
      await transporter.sendMail({
        from: `EasyCare <${user}>`,
        to: email,
        subject: 'Your EasyCare Verification Code',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
            <h2 style="margin:0 0 8px;color:#111827">Your OTP Code</h2>
            <p style="color:#6b7280;margin:0 0 24px">Use this code to verify your EasyCare account.</p>
            <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:700;color:#111827">
              ${otp}
            </div>
            <p style="color:#9ca3af;font-size:13px;margin:20px 0 0">Valid for 5 minutes. Do not share this code with anyone.</p>
          </div>
        `,
      });
      this.logger.log(`Email OTP sent to ${email}`);
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${email}:`,
        err instanceof Error ? err.message : err,
      );
      throw new Error('Failed to send OTP via email. Please try again.');
    }
  }
}
