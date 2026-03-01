import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './auth-context';
import { View, Text, ActivityIndicator } from 'react-native';
import { storeTokens } from '@/services/api';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { refreshAuthState } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');

        if (accessToken && refreshToken) {
          await storeTokens(accessToken, refreshToken);
          await refreshAuthState();
          window.history.replaceState({}, document.title, window.location.pathname);
          
          router.replace('/(tabs)');
        } else {
          throw new Error('Missing tokens in callback');
        }
      } catch (error) {
        console.error('OAuth Callback Error:', error);
        router.replace('/(auth)/login');
      }
    };

    handleCallback();
  }, [refreshAuthState, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text>Logging you in...</Text>
    </View>
  );
}
