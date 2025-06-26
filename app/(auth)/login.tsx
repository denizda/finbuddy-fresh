import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    if (error) {
      Alert.alert('Authentication Error', error);
      clearError();
    }
  }, [error]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password');
      return;
    }
    
    try {
      // Clear any previous errors
      clearError();
      // Call login and explicitly handle the result
      const result = await login(email, password);
      console.log('[LOGIN] Login result:', result);
      
      if (result?.error) {
        // Error will be shown by the error effect
        return;
      }
      
      // If we get here, login was successful
      console.log('[LOGIN] Login successful, waiting for navigation...');
    } catch (error) {
      console.error('[LOGIN] Login error:', error);
      Alert.alert('Login Error', 'An unexpected error occurred during login');
    }
  };
  
  const handleNavigateToSignup = () => {
    // @ts-ignore - Expo Router types are not up to date with file-based routing
    router.push('/signup');
  };



  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Text style={styles.logoText}>FB</Text>
          </View>
          <Text style={styles.appName}>FinBuddy</Text>
          <Text style={styles.tagline}>Your personal finance companion</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitleText}>Sign in to continue</Text>

          <View style={[
            styles.inputContainer, 
            isEmailFocused && styles.inputContainerFocused
          ]}>
            <Icon name="mail" size={20} color={isEmailFocused ? Colors.primary : Colors.secondaryText} />
            <TextInput
              testID="email-input"
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.secondaryText}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
              accessibilityLabel="Email input"
            />
          </View>

          <View style={[
            styles.inputContainer, 
            isPasswordFocused && styles.inputContainerFocused
          ]}>
            <Icon name="lock" size={20} color={isPasswordFocused ? Colors.primary : Colors.secondaryText} />
            <TextInput
              testID="password-input"
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.secondaryText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              accessibilityLabel="Password input"
            />
          </View>

          <TouchableOpacity style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            testID="login-button"
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityLabel="Login button"
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <>
                <Icon name="log-in" size={20} color={Colors.background} />
                <Text style={styles.loginButtonText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account?</Text>
          <TouchableOpacity onPress={handleNavigateToSignup}>
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.background,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: Colors.secondaryText,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: Colors.secondaryText,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 16,
    marginBottom: 24,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
    marginLeft: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  signupText: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  signupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
});