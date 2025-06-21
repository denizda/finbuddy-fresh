import { createReactQueryHooks } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { Platform } from "react-native";
import type { AppRouter } from './trpc-app-router';

export const trpc = createReactQueryHooks<AppRouter>();

const getBaseUrl = () => {
  // For development, use localhost with the correct port
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }
    // For iOS simulator and physical devices
    return 'http://localhost:3000';
  }
  
  // In production, use the deployed URL
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Fallback for web
  if (Platform.OS === 'web') {
    return ''; // Use relative URL for web
  }
  
  // Fallback for production native apps
  return 'https://your-production-api.com';
};

// Helper to get the auth token
const getToken = () => {
  // Get the token from your auth store
  // Example: return useAuthStore.getState().session?.access_token;
  return '';
};

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
  // Disable batching for now to simplify debugging
  // batch: { enabled: false },
});