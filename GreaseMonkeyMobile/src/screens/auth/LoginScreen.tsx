import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { Button, Input, Card } from '../../components/ui';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://customer-assets.emergentagent.com/job_codeflow-9/artifacts/ly6ycfum_Gemini_Generated_Image_ni2zlyni2zlyni2z.svg' }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>GreaseMonkey</Text>
          <Text style={styles.subtitle}>Welcome to the gearhead community</Text>
        </View>

        <Card style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon="lock-closed-outline"
          />

          <Button
            title={isLoading ? 'Signing In...' : 'Sign In'}
            onPress={handleLogin}
            disabled={isLoading}
            loading={isLoading}
            style={styles.button}
          />

          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.DEFAULT,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    marginBottom: theme.spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground.DEFAULT,
    marginTop: theme.spacing.xl,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground.muted,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: theme.spacing.md,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  linkText: {
    color: theme.colors.foreground.muted,
    fontSize: theme.typography.fontSize.sm,
  },
  linkTextBold: {
    color: theme.colors.primary.orange,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

export default LoginScreen;