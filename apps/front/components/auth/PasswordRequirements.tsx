import { View, Text, StyleSheet } from 'react-native';

interface PasswordRequirementsProps {
  password: string;
  confirmPassword?: string;
}

export default function PasswordRequirements({ password, confirmPassword }: PasswordRequirementsProps) {
  const requirements = [
    {
      text: 'At least 8 characters',
      met: password.length >= 8
    },
    {
      text: 'One uppercase letter (A-Z)',
      met: /[A-Z]/.test(password)
    },
    {
      text: 'One lowercase letter (a-z)',
      met: /[a-z]/.test(password)
    },
    {
      text: 'One number (0-9)',
      met: /[0-9]/.test(password)
    },
    {
      text: 'One special character (!@#$...)',
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    },
  ];

  // Add password match requirement if confirmPassword is provided
  if (confirmPassword !== undefined) {
    requirements.push({
      text: 'Passwords match',
      met: password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
    });
  }

  const allMet = requirements.every(req => req.met);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Password Requirements:</Text>
      {requirements.map((req, index) => (
        <View key={index} style={styles.requirement}>
          <Text style={[styles.indicator, req.met && styles.indicatorMet]}>
            {req.met ? '✓' : '○'}
          </Text>
          <Text style={[styles.text, req.met && styles.textMet]}>
            {req.text}
          </Text>
        </View>
      ))}
      {password.length > 0 && allMet && (
        <Text style={styles.success}>✓ All requirements met!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicator: {
    fontSize: 16,
    marginRight: 8,
    color: '#999',
    width: 20,
  },
  indicatorMet: {
    color: '#4CAF50',
  },
  text: {
    fontSize: 14,
    color: '#999',
  },
  textMet: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  success: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
  },
});
