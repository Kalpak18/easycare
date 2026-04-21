import apiPublic from './api.public';

// ── Phone OTP ─────────────────────────────────────────────────
export const sendOtp = (phone: string) =>
  apiPublic.post('/auth/user/send-otp', { phone });

export const verifyOtp = (phone: string, otp: string) =>
  apiPublic.post('/auth/user/verify-otp', { phone, otp });

export const completeProfile = (phone: string, name: string, email?: string) =>
  apiPublic.post('/auth/user/complete-profile', { phone, name, email });

// ── Email OTP ─────────────────────────────────────────────────
export const sendOtpEmail = (email: string) =>
  apiPublic.post('/auth/user/send-otp-email', { email });

export const verifyOtpEmail = (email: string, otp: string) =>
  apiPublic.post('/auth/user/verify-otp-email', { email, otp });

export const completeProfileEmail = (email: string, name: string, phone: string) =>
  apiPublic.post('/auth/user/complete-profile-email', { email, name, phone });
