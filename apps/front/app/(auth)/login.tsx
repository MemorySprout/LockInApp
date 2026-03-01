import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { api, oauthLogin } from '@/services/api';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const { refreshAuthState } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await api.login({ email, password });
      await refreshAuthState();
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Login failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      try {
        setLoading(true);
        const success = await oauthLogin();
        if (success) {
          await refreshAuthState();
          router.replace('/(tabs)');
        }
      } catch (e: any) {
        Alert.alert('Google Login failed', e.message);
      } finally {
        setLoading(false);
      }
    };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.googleButton, loading && styles.buttonDisabled]}
          onPress={handleGoogleLogin}
          disabled={loading}>
          <Text>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Log In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff'
  },
  formContainer: {
    width: '100%',
    maxWidth: 450,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 14, marginBottom: 16, fontSize: 16, backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#6C63FF', borderRadius: 10,
    padding: 16, alignItems: 'center', marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: '#6C63FF', textAlign: 'center', fontSize: 14 },
  googleButton: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 16, alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#ddd'
  },
});