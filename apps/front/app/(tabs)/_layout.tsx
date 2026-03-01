import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/context/auth-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/(auth)/login');
    }
  }, [isLoggedIn, isLoading]);

  // Don't render tabs if not logged in
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Navbar />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
        }}>
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
