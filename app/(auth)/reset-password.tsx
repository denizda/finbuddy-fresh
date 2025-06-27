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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please enter both password fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Password Updated', 
          'Your password has been successfully updated',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
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
          <Text style={styles.tagline}>Reset Your Password</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Create New Password</Text>
          <Text style={styles.subtitleText}>Enter your new password below</Text>

          <View style={[
            styles.inputContainer, 
            isPasswordFocused && styles.inputContainerFocused
          ]}>
            <Icon name="lock" size={20} color={isPasswordFocused ? Colors.primary : Colors.secondaryText} />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor={Colors.secondaryText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              keyboardType="numeric"
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              accessibilityLabel="New password input"
            />
          </View>

          <View style={[
            styles.inputContainer, 
            isConfirmPasswordFocused && styles.inputContainerFocused
          ]}>
            <Icon name="lock" size={20} color={isConfirmPasswordFocused ? Colors.primary : Colors.secondaryText} />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              placeholderTextColor={Colors.secondaryText}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              keyboardType="numeric"
              onFocus={() => setIsConfirmPasswordFocused(true)}
              onBlur={() => setIsConfirmPasswordFocused(false)}
              accessibilityLabel="Confirm password input"
            />
          </View>

          <TouchableOpacity 
            style={styles.resetButton}
            onPress={handleResetPassword}
            disabled={isLoading}
            accessibilityLabel="Reset password button"
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <>
                <Icon name="check" size={20} color={Colors.background} />
                <Text style={styles.resetButtonText}>Update Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.backContainer}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.backButtonText}>← Back to Login</Text>
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
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: Colors.secondaryText,
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}05`,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
    marginLeft: 8,
  },
  backContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
}); 