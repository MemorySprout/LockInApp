import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from './storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { notifySessionExpired } from './session-service';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const storeTokens = async (accessToken: string, refreshToken: string) => {
  await storage.setItem('accessToken', accessToken);
  await storage.setItem('refreshToken', refreshToken);
};

export const clearTokens = async () => {
  await storage.deleteItem('accessToken');
  await storage.deleteItem('refreshToken');
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshToken = await storage.getItem('refreshToken');

          // If no refresh token, user was never logged in - just reject without session expired notification
          if (!refreshToken) {
            isRefreshing = false;
            return Promise.reject(error);
          }

          const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          await storeTokens(accessToken, newRefreshToken);

          isRefreshing = false;
          onTokenRefreshed(accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];
          await clearTokens();
          // Only notify session expired if refresh token existed (user was logged in)
          notifySessionExpired();
          return Promise.reject(refreshError);
        }
      }

      return new Promise((resolve) => {
        addRefreshSubscriber((token: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

const sanitizeError = (message: string | undefined, fallback: string): string => {
  if (!message || typeof message !== 'string') return fallback;
  // Don't show raw JS errors to users
  if (message.includes('Cannot read properties') || message.includes('undefined') || message.includes('TypeError')) {
    return fallback;
  }
  return message;
};

export const api = {
  register: async (data: { email: string; username: string; password: string }) => {
    try {
      const response = await axiosInstance.post('/api/auth/register', data);
      await storeTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    } catch (error: any) {
      throw new Error(sanitizeError(error.response?.data?.message, 'Registration failed. Please try again.'));
    }
  },

  login: async (data: { email: string; password: string }) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', data);
      await storeTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    } catch (error: any) {
      throw new Error(sanitizeError(error.response?.data?.message, 'Login failed. Please try again.'));
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch (error) {
      // Intentionally ignore - we clear tokens locally regardless of server response
    } finally {
      await clearTokens();
    }
  },
};

const isWeb = typeof window !== 'undefined';

export const oauthLogin = async () => {
  try {
    if (isWeb) {
      return await webOAuthLogin();
    } else {
      return await nativeOAuthLogin();
    }
  } catch (error: any) {
    throw new Error(error.message || 'Google login failed');
  }
};

const webOAuthLogin = async (): Promise<boolean> => {
  const currentUrl = window.location.href;
  window.location.href = `${BASE_URL}/api/oauth/google?redirect_uri=${encodeURIComponent(currentUrl)}`;
  return true;
};

const nativeOAuthLogin = async (): Promise<boolean> => {
  try {
    const redirectUri = Linking.createURL('oauth-callback');

    const result = await WebBrowser.openAuthSessionAsync(
      `${BASE_URL}/api/oauth/google?redirect_uri=${encodeURIComponent(redirectUri)}`,
      redirectUri,
      {
        showInRecents: true,
      }
    );

    if (result.type === 'success') {
      const url = result.url;
      const hashPart = url.split('#')[1] || '';
      const params = new URLSearchParams(hashPart);

      const accessToken = params.get('accessToken') as string;
      const refreshToken = params.get('refreshToken') as string;

      if (accessToken && refreshToken) {
        await storeTokens(accessToken, refreshToken);
        return true;
      } else {
        throw new Error('Tokens missing from redirect URL');
      }
    } else if (result.type === 'cancel') {
      return false;
    }

    return false;
  } catch (error: any) {
    throw error;
  }
};

if (isWeb && typeof window !== 'undefined') {
  const handleOAuthCallback = async () => {
    try {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');

      if (accessToken && refreshToken) {
        await storeTokens(accessToken, refreshToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        window.dispatchEvent(new Event('oauth-success'));
        return true;
      }
    } catch (error) {
      // Silent fail - callback will be retried
    }
    return false;
  };

  if (window.location.hash.includes('accessToken')) {
    handleOAuthCallback();
  }
}

export { axiosInstance };