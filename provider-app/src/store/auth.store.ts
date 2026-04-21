import { create } from 'zustand';
import axios from 'axios';
import { storage } from '../utils/storage';
import { ENV } from '../config/env';
import { api } from '../services/api';
import { useProviderStore } from './provider.store';

/**
 * ---------------- TYPES ----------------
 */

type Role = 'PROVIDER' | 'USER' | 'ADMIN';

export type KycStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

type AuthState = {
  accessToken: string | null;
  role: Role | null;

  // Provider-only states
  isVerified: boolean | null;
  kycStatus: KycStatus | null;

  isAuthLoaded: boolean;

  setSession: (data: {
    accessToken: string;
    refreshToken: string;
    role: Role;
    isVerified?: boolean;
    kycStatus?: KycStatus;
  }) => Promise<void>;

  loadAuth: () => Promise<void>;
  logout: () => Promise<void>;

  /** Poll-friendly: fetches fresh isVerified + kycStatus from /providers/me */
  refreshKycStatus: () => Promise<void>;
};

/**
 * ---------------- STORE ----------------
 */

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  role: null,
  isVerified: null,
  kycStatus: null,
  isAuthLoaded: false,

  /**
   * Called after LOGIN / REGISTER
   */
  async setSession({
  accessToken,
  refreshToken,
  role,
  isVerified,
  kycStatus,
}) {
  await Promise.all([
    storage.set('refreshToken', refreshToken),
    storage.set('accessToken', accessToken),
    storage.set('role', role),
    storage.set('isVerified', String(isVerified ?? false)),
    storage.set('kycStatus', kycStatus ?? 'NOT_STARTED'),
  ]);

  set({
    accessToken,
    role,
    isVerified: role === 'PROVIDER' ? isVerified ?? false : null,
    kycStatus: role === 'PROVIDER' ? kycStatus ?? 'NOT_STARTED' : null,
    isAuthLoaded: true,
  });
},

  /**
   * App bootstrap – refresh token rotation
   */
  async loadAuth() {
    const refreshToken = await storage.get('refreshToken');

    if (!refreshToken) {
      set({
        accessToken: null,
        role: null,
        isVerified: null,
        kycStatus: null,
        isAuthLoaded: true,
      });
      return;
    }

    try {
      // Use plain axios (not the interceptor-equipped `api`) so the 401
      // response interceptor cannot interfere with bootstrap refresh.
      const res = await axios.post(
        `${ENV.API_BASE_URL}/auth/refresh`,
        { refreshToken },
      );

      const {
        accessToken,
        refreshToken: newRt,
        role,
        isVerified,
        kycStatus,
      } = res.data;

      await storage.set('refreshToken', newRt);

      set({
        accessToken,
        role,
        isVerified: role === 'PROVIDER' ? isVerified ?? false : null,
        kycStatus: role === 'PROVIDER' ? kycStatus ?? 'NOT_STARTED' : null,
        isAuthLoaded: true,
      });
    } catch (err: any) {
      const is401 = err?.response?.status === 401;

      if (is401) {
        // Token explicitly rejected — hard logout
        await Promise.all([
          storage.remove('refreshToken'),
          storage.remove('accessToken'),
          storage.remove('role'),
          storage.remove('isVerified'),
          storage.remove('kycStatus'),
        ]);
        set({ accessToken: null, role: null, isVerified: null, kycStatus: null, isAuthLoaded: true });
      } else {
        // Network error / server down — use the last known session so the
        // provider doesn't get kicked to the login screen.
        const [cachedToken, cachedRole, cachedVerified, cachedKyc] = await Promise.all([
          storage.get('accessToken'),
          storage.get('role'),
          storage.get('isVerified'),
          storage.get('kycStatus'),
        ]);

        set({
          accessToken: cachedToken,
          role: (cachedRole as Role) ?? null,
          isVerified: cachedRole === 'PROVIDER' ? cachedVerified === 'true' : null,
          kycStatus: cachedRole === 'PROVIDER' ? (cachedKyc as KycStatus) ?? 'NOT_STARTED' : null,
          isAuthLoaded: true,
        });
      }
    }
  },

  /**
   * Fetch fresh isVerified + kycStatus from /providers/me
   * Called by WaitingForAdminApprovalScreen polling
   */
  async refreshKycStatus() {
    try {
      const res = await api.get('/providers/me');
      const { isVerified, kycStatus } = res.data;
      set({
        isVerified: isVerified ?? false,
        kycStatus: kycStatus ?? 'NOT_STARTED',
      });
    } catch {
      // silently ignore — network blip during polling
    }
  },

  /**
   * Logout (all roles)
   */
  async logout() {
    const rt = await storage.get('refreshToken');

    if (rt) {
      try {
        await api.post('/auth/logout', { refreshToken: rt });
      } catch {}
      await Promise.all([
        storage.remove('refreshToken'),
        storage.remove('accessToken'),
        storage.remove('role'),
        storage.remove('isVerified'),
        storage.remove('kycStatus'),
      ]);
    }

    set({
      accessToken: null,
      role: null,
      isVerified: null,
      kycStatus: null,
      isAuthLoaded: true,
    });

    // Clear cached provider dashboard so stale data isn't shown on next login
    useProviderStore.getState().reset();
  },
}));
