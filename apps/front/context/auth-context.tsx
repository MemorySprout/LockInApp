import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { router } from 'expo-router';
import { storage } from '@/services/storage';
import { api } from '@/services/api';
import { setSessionExpiredHandler } from '@/services/session-service';
import SessionExpiredModal from '@/components/modals/SessionExpiredModal';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  handleSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  const refreshAuthState = async () => {
    const token = await storage.getItem('accessToken');
    setIsLoggedIn(!!token);
  };

  useEffect(() => {
    refreshAuthState().finally(() => setIsLoading(false));

    // Register session expired handler
    setSessionExpiredHandler(() => {
      setShowSessionExpired(true);
    });
  }, []);

  const logout = async () => {
    await api.logout(); // This already clears tokens
    setIsLoggedIn(false);
    router.replace('/(auth)/login');
  };

  const handleSessionExpired = () => {
    setShowSessionExpired(true);
  };

  const handleCloseSessionExpired = () => {
    setShowSessionExpired(false);
    setIsLoggedIn(false);
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, logout, refreshAuthState, handleSessionExpired }}>
      {children}
      <SessionExpiredModal visible={showSessionExpired} onClose={handleCloseSessionExpired} />
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};