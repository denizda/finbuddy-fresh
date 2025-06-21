import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Lazy initialization of Supabase client
let _supabase: SupabaseClient | null = null;

function getSupabaseClient() {
  if (_supabase) return _supabase;
  
  // Get environment variables from Expo config
  const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL;
  const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY;

  // Log the configuration for debugging
  console.log('Supabase Config:', {
    url: supabaseUrl ? 'Set' : 'Not Set',
    key: supabaseAnonKey ? 'Set' : 'Not Set',
    extra: Constants.expoConfig?.extra
  });

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = 'Missing required environment variables: ' +
      (!supabaseUrl ? 'SUPABASE_URL ' : '') +
      (!supabaseAnonKey ? 'SUPABASE_ANON_KEY' : '');
    console.error(errorMessage);
    console.error('Available config:', Constants.expoConfig);
    throw new Error(errorMessage);
  }

  // Create Supabase client
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'finbuddy-mobile-app/1.0.0'
      }
    }
  });
  
  return _supabase;
}

// Export a proxy that initializes the client on first access
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop, receiver) {
    const client = getSupabaseClient();
    return Reflect.get(client, prop, receiver);
  }
});

// Test connection function - call this after the app initializes
export async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    // Test with the portfolio table which we know exists
    const { data, error } = await supabase
      .from('portfolio')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Supabase connection error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }
    
    console.log('✅ Successfully connected to Supabase and verified portfolio table access');
    return true;
  } catch (error: any) {
    console.error('❌ Error connecting to Supabase:', error.message);
    throw error;
  }
}