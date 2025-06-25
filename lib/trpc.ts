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
    // For iOS simulator and physical devices in development
    return 'http://localhost:3000';
  }
  
  // In production, use environment variable or hardcoded Vercel URL
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Fallback for web
  if (Platform.OS === 'web') {
    return ''; // Use relative URL for web
  }
  
  // FOR PRODUCTION: Replace this with your actual Vercel URL
  // TODO: Update this with your real Vercel deployment URL
  const VERCEL_URL = 'https://finbuddy-fresh-9mom.vercel.app';
  console.log('Using production API URL:', VERCEL_URL);
  return VERCEL_URL;
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
        if (baseUrl && !baseUrl.includes('placeholder') && !baseUrl.includes('your-vercel-url-here')) {
          try {
            const response = await fetch(url, options);
            return response;
          } catch (error) {
            console.error('tRPC network error:', error);
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
        console.log('Backend disabled - returning mock response');
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