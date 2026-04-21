import axios from 'axios';
import { api } from './api';
import { storage } from '../utils/storage';
import { useAuthStore } from '../store/auth.store';
import { ENV } from '../config/env';

let isRefreshing = false;
let queue: ((token: string) => void)[] = [];

/**
 * REQUEST → attach token
 */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * RESPONSE → refresh token
 */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

if (!original) {
  return Promise.reject(error);
}


    if (
  error.response?.status === 401 &&
  !original._retry &&
  !original.url?.includes('/auth/refresh')
) {


      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.get('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        // IMPORTANT: use axios, not api
        const res = await axios.post(
          `${ENV.API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const {
          accessToken,
          refreshToken: newRt,
          role,
          isVerified,
          kycStatus,
        } = res.data;

        await useAuthStore.getState().setSession({
          accessToken,
          refreshToken: newRt,
          role,
          isVerified,
          kycStatus,
        });

        queue.forEach((cb) => cb(accessToken));
        queue = [];

        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (e: any) {
        queue.forEach((cb) => cb(''));
        queue = [];
        // Only hard-logout when the refresh endpoint itself rejects the token.
        // Network errors / timeouts must NOT clear the session.
        if (e?.response?.status === 401) {
          await useAuthStore.getState().logout();
        }
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
