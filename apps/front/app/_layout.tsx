import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

function NavigationContent() {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';

    if (!isLoggedIn && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuth) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <NavigationContent />
    </AuthProvider>
  );
}