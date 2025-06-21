import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
// import 'react-native-url-polyfill/auto';
// import { Database } from '@/types/supabase';
type Database = any;

// Lazy initialization of Supabase client
let _supabaseClient: SupabaseClient<Database> | null = null;

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  
  // Get environment variables from Expo config
  const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL || '';
  const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '';

  _supabaseClient = createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      db: {
        schema: 'public',
      },
    }
  );
  
  return _supabaseClient;
}

// Export a proxy that initializes the client on first access
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop, receiver) {
    const client = getSupabaseClient();
    return Reflect.get(client, prop, receiver);
  }
});

// Helper function to handle user updates with proper timestamp
export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }

  return data;
};

// Update the original supabase.ts file
export * from './supabase';

// This file provides a more robust Supabase client with proper TypeScript support
// and helper functions for common operations.
