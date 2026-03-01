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

          if (!refreshToken) {
            throw new Error('No refresh token available');
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

export const api = {
  register: async (data: { email: string; username: string; password: string }) => {
    try {
      const response = await axiosInstance.post('/api/auth/register', data);
      await storeTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  login: async (data: { email: string; password: string }) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', data);
      await storeTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch (error) {
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
    console.error("OAuth Error: ", error);
    throw new Error(error.message || 'Google login failed');
  }
};

const webOAuthLogin = async (): Promise<boolean> => {
  try {
    const currentUrl = window.location.href;
    window.location.href = `${BASE_URL}/api/oauth/google?redirect_uri=${encodeURIComponent(currentUrl)}`;
    return true;
  } catch (error: any) {
    console.error("Web OAuth Error: ", error);
    throw error;
  }
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
      console.log('OAuth Callback URL:', url);

      const parsed = Linking.parse(url);
      const params = parsed.queryParams || {};

      const accessToken = params.accessToken as string;
      const refreshToken = params.refreshToken as string;

      if (accessToken && refreshToken) {
        await storeTokens(accessToken, refreshToken);
        return true;
      } else {
        console.error('Missing tokens in redirect:', params);
        throw new Error('Tokens missing from redirect URL');
      }
    } else if (result.type === 'cancel') {
      console.log('OAuth cancelled by user');
      return false;
    }

    return false;
  } catch (error: any) {
    console.error("Native OAuth Error: ", error);
    throw error;
  }
};

if (isWeb && typeof window !== 'undefined') {
  const handleOAuthCallback = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');

      if (accessToken && refreshToken) {
        await storeTokens(accessToken, refreshToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        window.dispatchEvent(new Event('oauth-success'));
        return true;
      }
    } catch (error) {
      console.error('OAuth callback handling error:', error);
    }
    return false;
  };

  if (window.location.search.includes('accessToken')) {
    handleOAuthCallback();
  }
}

export { axiosInstance };