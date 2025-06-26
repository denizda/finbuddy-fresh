import Constants from 'expo-constants';

export const Config = {
  // Environment
  isDev: __DEV__,
  isProduction: process.env.NODE_ENV === 'production',
  
  // API URLs
  api: {
    production: 'https://finbuddy-fresh-9mom.vercel.app',
    development: {
      ios: 'http://localhost:3000',
      android: 'http://10.0.2.2:3000',
      web: ''
    }
  },
  
  // Supabase
  supabase: {
    url: Constants.expoConfig?.extra?.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // External APIs
  apis: {
    finnhub: process.env.FINNHUB_API_KEY,
    revenuecat: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
  },
  
  // App Settings
  app: {
    name: 'FinBuddy',
    version: '1.0.0',
    scheme: 'finbuddy',
    initialBalance: 100000, // $100,000 virtual trading balance
  },
  
  // Refresh Intervals (in milliseconds)
  intervals: {
    priceUpdate: 30000, // 30 seconds
    portfolioRefresh: 30000, // 30 seconds
  },
  
  // Deep Links
  links: {
    prefixes: ['finbuddy://', 'https://rork.app'],
    domains: ['rork.app']
  }
};

export default Config; 