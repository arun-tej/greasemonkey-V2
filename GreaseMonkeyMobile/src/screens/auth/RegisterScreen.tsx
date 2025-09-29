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
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';
import { Button, Input, Card } from '../../components/ui';

const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!email || !username || !fullName || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email,
        username,
        full_name: fullName,
        password,
      });
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
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
              source={{ uri: 'https://customer-assets.emergentagent.com/job_greasy-github-sync/artifacts/kwpggzdn_Gemini_Generated_Image_bhb3n2bhb3n2bhb3.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Join GreaseMonkey</Text>
          <Text style={styles.subtitle}>Start your journey with fellow enthusiasts</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
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
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              leftIcon="person-outline"
            />

            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              leftIcon="person-outline"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon="lock-closed-outline"
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              leftIcon="lock-closed-outline"
            />

            <Button
              title={isLoading ? 'Creating Account...' : 'Create Account'}
              onPress={handleRegister}
              disabled={isLoading}
              loading={isLoading}
              style={styles.button}
            />

            <TouchableOpacity 
              style={styles.linkButton} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
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
    marginBottom: 40,
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

export default RegisterScreen;