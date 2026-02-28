import { storage } from './storage';

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

export { authFetch };