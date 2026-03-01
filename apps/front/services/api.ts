import { storage } from './storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { notifySessionExpired } from './session-service';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const storeTokens = async (accessToken: string, refreshToken: string) => {
  await storage.setItem('accessToken', accessToken);
  await storage.setItem('refreshToken', refreshToken);
};

export const clearTokens = async () => {
  await storage.deleteItem('accessToken');
  await storage.deleteItem('refreshToken');
};

const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const accessToken = await storage.getItem('accessToken');
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, ...options.headers },
  });

  if (res.status === 401) {
    const refreshToken = await storage.getItem('refreshToken');
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      await clearTokens();
      notifySessionExpired();
      throw new Error('SESSION_EXPIRED');
    }

    const { accessToken: newAccess, refreshToken: newRefresh } = await refreshRes.json();
    await storeTokens(newAccess, newRefresh);

    return fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${newAccess}`, ...options.headers },
    });
  }

  return res;
};

export const api = {
  register: async (data: { email: string; username: string; password: string }) => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).message ?? 'Registration failed');
    const json = await res.json();
    await storeTokens(json.accessToken, json.refreshToken);
    return json;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).message ?? 'Login failed');
    const json = await res.json();
    await storeTokens(json.accessToken, json.refreshToken);
    return json;
  },

  logout: async () => {
    try { await authFetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' }); } catch {}
    await clearTokens();
  },
};

export const oauthLogin = async () => {
  try {
    const redirectUri = Linking.createURL('oauth-callback');
    const result = await WebBrowser.openAuthSessionAsync(
      `${BASE_URL}/api/oauth/google?redirect_uri=${encodeURIComponent(redirectUri)}`,
      redirectUri
    );
    if (result.type === 'success') {
      const parsedUrl = Linking.parse(result.url);
      const accessToken = parsedUrl.queryParams?.accessToken as string;
      const refreshToken = parsedUrl.queryParams?.refreshToken as string;

      if (accessToken && refreshToken) {
        await storeTokens(accessToken, refreshToken);
        return true; 
      } else {
        throw new Error('Tokens missing from redirect URL');
      }
    }

    return false; 
  } catch (error: any) {
    console.error("OAuth Error: ", error);
    throw new Error(error.message || 'Google login failed');
  }
};

export { authFetch };