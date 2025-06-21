import { Stack } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { Redirect } from 'expo-router';
import Colors from '@/constants/colors';

export default function AuthLayout() {
  // No automatic redirection - allow access to auth screens at any time
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: {
          backgroundColor: '#fff',
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen 
        name="signup" 
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Create Account',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.primary,
        }}
      />
    </Stack>
  );
}
