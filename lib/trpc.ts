import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { Platform } from "react-native";
import Constants from 'expo-constants';
import { Config } from './config';
import { Logger } from './logger';
import type { AppRouter } from '../backend/trpc/app-router';
import superjson from 'superjson';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Check if we're running in Expo Go on a physical device (tunnel mode)
  const isExpoGo = Constants.appOwnership === 'expo';
  const isPhysicalDevice = !Constants.isDevice || Platform.OS === 'ios';
  
  // If running in Expo Go on physical device, use production API
  if (isExpoGo && isPhysicalDevice) {
    Logger.info('Using production API for Expo Go on physical device');
    return Config.api.production;
  }
  
  // For development, use localhost with the correct port
  if (Config.isDev) {
    if (Platform.OS === 'android') {
      return Config.api.development.android;
    }
    if (Platform.OS === 'web') {
      return Config.api.development.web;
    }
    // For iOS simulator and physical devices in development
    return Config.api.development.ios;
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
      url: baseUrl ? `${baseUrl}/api/trpc` : 'https://api.placeholder.com/api/trpc',
      fetch: async (url, options) => {
        // In production with Vercel, make normal API calls
        if (baseUrl && !baseUrl.includes('placeholder')) {
          try {
            const response = await fetch(url, options);
            return response;
          } catch (error) {
            Logger.error('tRPC network error', error);
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
        
        // If no backend URL configured, return mock success response
        Logger.debug('Backend disabled - returning mock response');
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
    }),
  ],
  transformer: superjson,
});