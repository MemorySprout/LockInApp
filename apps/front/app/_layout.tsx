import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/auth-context';

function RootGuard() {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    console.log('segments:', segments);
    console.log('isLoggedIn:', isLoggedIn);
    const inAuth = segments[0] === '(auth)';
    console.log('inAuth:', inAuth);
    if (!isLoggedIn && !inAuth) router.replace('/(auth)/login');
    if (isLoggedIn && inAuth) router.replace('/(tabs)');
  }, [isLoggedIn, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}