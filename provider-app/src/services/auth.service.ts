import { publicApi } from './api.public';

// ── Phone OTP ─────────────────────────────────────────────────
export const sendOtp = (phone: string) =>
  publicApi.post('/auth/provider/send-otp', { phone });

export const verifyOtp = (phone: string, otp: string) =>
  publicApi.post('/auth/provider/verify-otp', { phone, otp });

export const completeProfile = (data: {
  phone: string;
  name: string;
  categoryId: string;
  email?: string;
}) => publicApi.post('/auth/provider/complete-profile', data);

// ── Email OTP ─────────────────────────────────────────────────
export const sendOtpEmail = (email: string) =>
  publicApi.post('/auth/provider/send-otp-email', { email });

export const verifyOtpEmail = (email: string, otp: string) =>
  publicApi.post('/auth/provider/verify-otp-email', { email, otp });

export const completeProfileEmail = (data: {
  email: string;
  name: string;
  phone: string;
  categoryId: string;
}) => publicApi.post('/auth/provider/complete-profile-email', data);
