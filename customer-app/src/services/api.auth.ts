import api from './api';
import apiPublic from './api.public';
import { useAuthStore } from '../store/auth.store';
import storage from '../utils/storage';

const REFRESH_TOKEN_KEY = 'customer_refresh_token';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await storage.get(REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error('No refresh token');

      const res = await apiPublic.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = res.data;

      await storage.set(REFRESH_TOKEN_KEY, newRefreshToken);
      useAuthStore.getState().setSession({ accessToken, refreshToken: newRefreshToken });

      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (err: any) {
      processQueue(err, null);
      // Only hard-logout when the refresh endpoint itself rejects the token.
      // Network errors / timeouts must NOT clear the session.
      if (err?.response?.status === 401) {
        await useAuthStore.getState().logout();
      }
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
