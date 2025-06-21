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
import { useAuthStore } from '@/stores/auth-store';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isSurnameFocused, setIsSurnameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  
  const router = useRouter();
  const { signUp, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    if (error) {
      Alert.alert('Signup Error', error);
      clearError();
    }
  }, [error]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSignup = async () => {
    if (!name || !surname || !email || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }
    
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }
    
    if (password.length !== 6 || !/^\d+$/.test(password)) {
      Alert.alert('Invalid PIN', 'PIN must be exactly 6 digits');
      return;
    }
    
    try {
      const result = await signUp(email, password, name, surname);
      
      if (result?.success) {
        Alert.alert(
          'Success!', 
          'Your account has been created successfully. Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Optionally navigate to login or home screen
                router.replace('/(auth)/login');
              }
            }
          ]
        );
      } else if (result?.error) {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Signup error:', error);
      // Error is already handled by the auth store
    }
  };

  const handleGoToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // @ts-ignore - Expo Router types are not up to date with file-based routing
      router.replace('/login');
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
          <Text style={styles.tagline}>Create your account</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoToLogin}
        >
          <Icon name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <View style={styles.nameRow}>
            <View style={[
              styles.inputContainer, 
              styles.nameInput,
              isNameFocused && styles.inputContainerFocused
            ]}>
              <Icon 
                name="user" 
                size={20} 
                color={isNameFocused ? Colors.primary : Colors.secondaryText} 
              />
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor={Colors.secondaryText}
                value={name}
                onChangeText={setName}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="givenName"
                returnKeyType="next"
                onSubmitEditing={() => {}}
              />
            </View>
            <View style={[
              styles.inputContainer, 
              styles.nameInput,
              isSurnameFocused && styles.inputContainerFocused
            ]}>
              <TextInput
                style={[styles.input, { marginLeft: 10 }]}
                placeholder="Surname"
                placeholderTextColor={Colors.secondaryText}
                value={surname}
                onChangeText={setSurname}
                onFocus={() => setIsSurnameFocused(true)}
                onBlur={() => setIsSurnameFocused(false)}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="familyName"
                returnKeyType="next"
                onSubmitEditing={() => {}}
              />
            </View>
          </View>

          <View style={[
            styles.inputContainer, 
            isEmailFocused && styles.inputContainerFocused
          ]}>
            <Icon 
              name="mail" 
              size={20} 
              color={isEmailFocused ? Colors.primary : Colors.secondaryText} 
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={Colors.secondaryText}
              value={email}
              onChangeText={(text) => setEmail(text.toLowerCase().trim())}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              inputMode="email"
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => {
                setIsEmailFocused(false);
                setEmail(email => email.trim());
              }}
            />
          </View>

          <View style={[
            styles.inputContainer, 
            isPasswordFocused && styles.inputContainerFocused
          ]}>
            <Icon 
              name="lock" 
              size={20} 
              color={isPasswordFocused ? Colors.primary : Colors.secondaryText} 
            />
            <TextInput
              style={styles.input}
              placeholder="6 Digit PIN"
              placeholderTextColor={Colors.secondaryText}
              value={password}
              onChangeText={setPassword}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              autoComplete="off"
              textContentType="oneTimeCode"
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
          </View>

          <View style={[
            styles.inputContainer, 
            isConfirmPasswordFocused && styles.inputContainerFocused
          ]}>
            <Icon 
              name="lock" 
              size={20} 
              color={isConfirmPasswordFocused ? Colors.primary : Colors.secondaryText} 
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm 6 Digit PIN"
              placeholderTextColor={Colors.secondaryText}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              autoComplete="off"
              textContentType="oneTimeCode"
              onFocus={() => setIsConfirmPasswordFocused(true)}
              onBlur={() => setIsConfirmPasswordFocused(false)}
            />
          </View>

          <TouchableOpacity 
            style={styles.signupButton}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  nameInput: {
    flex: 1,
    marginRight: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: Colors.secondaryText,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: Colors.primary,
    marginLeft: 8,
    fontSize: 16,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text,
  },
  signupButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
