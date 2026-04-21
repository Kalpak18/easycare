import { create } from 'zustand';
import storage from '../utils/storage';
import apiPublic from '../services/api.public';

const REFRESH_TOKEN_KEY = 'customer_refresh_token';
const ACCESS_TOKEN_KEY  = 'customer_access_token';

function decodeUserId(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  isAuthLoaded: boolean;

  setSession: (data: { accessToken: string; refreshToken: string }) => Promise<void>;
  loadAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userId: null,
  isAuthLoaded: false,

  setSession: async ({ accessToken, refreshToken }) => {
    await Promise.all([
      storage.set(REFRESH_TOKEN_KEY, refreshToken),
      storage.set(ACCESS_TOKEN_KEY, accessToken),
    ]);
    set({ accessToken, userId: decodeUserId(accessToken), isAuthLoaded: true });
  },

  loadAuth: async () => {
    const refreshToken = await storage.get(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      set({ isAuthLoaded: true });
      return;
    }

    try {
      const res = await apiPublic.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = res.data;

      await Promise.all([
        storage.set(REFRESH_TOKEN_KEY, newRefreshToken),
        storage.set(ACCESS_TOKEN_KEY, accessToken),
      ]);
      set({ accessToken, userId: decodeUserId(accessToken), isAuthLoaded: true });
    } catch (err: any) {
      if (err?.response?.status === 401) {
        // Token explicitly rejected — hard logout
        await Promise.all([
          storage.remove(REFRESH_TOKEN_KEY),
          storage.remove(ACCESS_TOKEN_KEY),
        ]);
        set({ accessToken: null, userId: null, isAuthLoaded: true });
      } else {
        // Network error / server down — use last known session so customer
        // doesn't get kicked to the login screen on every cold start.
        const cached = await storage.get(ACCESS_TOKEN_KEY);
        set({
          accessToken: cached,
          userId: cached ? decodeUserId(cached) : null,
          isAuthLoaded: true,
        });
      }
    }
  },

  logout: async () => {
    try {
      const refreshToken = await storage.get(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await apiPublic.post('/auth/logout', { refreshToken });
      }
    } catch {
      // silent
    } finally {
      await Promise.all([
        storage.remove(REFRESH_TOKEN_KEY),
        storage.remove(ACCESS_TOKEN_KEY),
      ]);
      set({ accessToken: null, userId: null });
    }
  },
}));
