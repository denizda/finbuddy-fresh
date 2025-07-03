import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { Platform } from "react-native";
import Constants from 'expo-constants';
import { Config } from './config';
import { Logger } from './logger';
import type { AppRouter } from '../backend/trpc/app-router';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Always use production API for now since local development server causes issues
  Logger.info('Using production API URL for stability');
  return Config.api.production;
  
  // Original logic commented out - uncomment when local dev server is stable
  /*
  if (Config.isDev) {
    Logger.info('Development mode - using local API');
    if (Platform.OS === 'android') {
      return Config.api.development.android;
    }
    if (Platform.OS === 'web') {
      return Config.api.development.web;
    }
    // For iOS physical devices in development, use Mac's IP
    return 'http://172.20.10.2:3000';
  }
  
  // In production, use environment variable or configured URL
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Fallback for web
  if (Platform.OS === 'web') {
    return Config.api.development.web;
  }
  
  // Production URL
  Logger.info('Using production API URL', { url: Config.api.production });
  return Config.api.production;
  */
};

// Helper to get the auth token
const getToken = () => {
  // Get the token from your auth store
  // Example: return useAuthStore.getState().session?.access_token;
  return '';
};

const baseUrl = getBaseUrl();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${baseUrl}/api/trpc`,
      fetch: async (url, options) => {
        try {
          Logger.debug('TRPC Request:', { url: url.toString() });
          const response = await fetch(url, options);
          Logger.debug('TRPC Response:', { status: response.status });
          return response;
        } catch (error) {
          Logger.error('TRPC network error', error);
          // Fallback to mock response on network error
          return new Response(JSON.stringify({ 
            result: { 
              data: { 
                portfolioItems: [], 
                summary: { 
                  totalValue: 0, 
                  dailyChange: 0, 
                  dailyChangePercentage: 0, 
                  allocation: [] 
                } 
              } 
            } 
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }),
  ],
  // Use standard JSON transformer to match backend
  transformer: {
    input: {
      serialize: (object) => object,
      deserialize: (object) => object,
    },
    output: {
      serialize: (object) => object,
      deserialize: (object) => object,
    },
  },
});