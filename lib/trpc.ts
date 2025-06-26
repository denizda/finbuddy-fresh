import { createReactQueryHooks } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { Platform } from "react-native";
import type { AppRouter } from '../backend/trpc/app-router';
import { Config } from './config';
import { Logger } from './logger';

export const trpc = createReactQueryHooks<AppRouter>();

const getBaseUrl = () => {
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
  // Disable batching for now to simplify debugging
  // batch: { enabled: false },
});