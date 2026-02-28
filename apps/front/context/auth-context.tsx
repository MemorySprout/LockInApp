import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { router } from 'expo-router';
import { storage } from '@/services/storage';
import { api, clearTokens } from '@/services/api';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    storage.getItem('accessToken').then((token) => {
      setIsLoggedIn(!!token);
      setIsLoading(false);
    });
  }, []);

  const logout = async () => {
    try { await api.logout(); } catch {}
    await clearTokens();
    setIsLoggedIn(false);
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};