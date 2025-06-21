import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Session, Subscription } from '@supabase/supabase-js';
import { useEffect } from 'react';

export type User = {
  id: string;
  name: string;
  surname: string;
  email: string;
  photo_url?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
};

interface AuthState {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Auth actions
  login: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
    user?: User;
  }>;
  signUp: (email: string, password: string, name: string, surname: string) => Promise<{
    success: boolean;
    error?: string;
    user?: User;
  }>;

  logout: () => Promise<void>;
  clearError: () => void;
  fetchUser: (userId: string) => Promise<void>;
  setSession: (session: Session | null) => void;
}

// Create the store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      session: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      setSession: (session) => set({ 
        session, 
        isAuthenticated: !!session,
        isLoading: false
      }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        console.log('[LOGIN] Starting login for', email);
        try {
          // Check if user exists in profiles table
          const { data: userData, error: userCheckError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

          console.log('[LOGIN] User check result:', { userData, userCheckError });

          if (userCheckError || !userData) {
            const errorMessage = 'Invalid email or password';
            console.error('[LOGIN]', errorMessage, { userCheckError, userData });
            set({ 
              error: errorMessage,
              isLoading: false 
            });
            return { success: false, error: errorMessage };
          }

          // Then try to sign in with Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          console.log('[LOGIN] Auth result:', { authData, authError });

          if (authError) {
            let errorMessage = authError.message;
            
            if (authError.message === 'Email not confirmed') {
              // Resend confirmation email if not confirmed
              const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email,
              });
              console.log('[LOGIN] Resend confirmation result:', { resendError });
              if (resendError) {
                errorMessage = 'Email not confirmed. Failed to resend confirmation email.';
                console.error('[LOGIN] Error resending confirmation email:', resendError);
              } else {
                errorMessage = 'Please check your email to confirm your account before logging in. A new confirmation email has been sent.';
              }
            }
            
            console.error('[LOGIN] Auth error:', errorMessage);
            set({ 
              error: errorMessage,
              isLoading: false 
            });
            return { success: false, error: errorMessage };
          }

          if (!authData.session) {
            const errorMessage = 'No session returned';
            console.error('[LOGIN]', errorMessage, { authData });
            set({ 
              error: errorMessage,
              isLoading: false 
            });
            return { success: false, error: errorMessage };
          }

          // Update the user's profile with the latest data
          const { data: updatedUserData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.session.user.id)
            .single();

          console.log('[LOGIN] Updated user data:', { updatedUserData, userError });

          if (userError || !updatedUserData) {
            const errorMessage = userError?.message || 'User not found in database';
            console.error('[LOGIN] User fetch error:', errorMessage);
            set({ 
              error: errorMessage,
              isLoading: false 
            });
            return { success: false, error: errorMessage };
          }

          set({ 
            session: authData.session, 
            user: updatedUserData,
            isAuthenticated: true, 
            isLoading: false 
          });
          
          console.log('[LOGIN] Login successful, state updated.');
          return { 
            success: true, 
            user: updatedUserData 
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
          console.error('[LOGIN] Login error:', errorMessage, error);
          set({ 
            error: error instanceof Error ? error.message : 'Login failed. Please try again.', 
            isLoading: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      signUp: async (email, password, name, surname) => {
        set({ isLoading: true, error: null });
        try {
          const fullName = `${name} ${surname}`.trim();
          
          // 1. Sign up the user with Supabase Auth
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: fullName,
              },
            },
          });

          if (signUpError) throw signUpError;
          if (!authData.user) throw new Error('No user returned from signup');

          // 2. Create a profile in the users table
          const { data: userData, error: profileError } = await supabase
            .from('users')
            .insert([
              { 
                id: authData.user.id,
                email: email.toLowerCase(),
                name,
                surname,
                password, // Supabase will handle the password hashing
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (profileError) throw profileError;
          if (!userData) throw new Error('Failed to create user profile');

          // Ensure the user object has all required fields
          const userWithSurname = {
            ...userData,
            name,
            surname,
          };

          set({ 
            session: authData.session,
            user: userWithSurname,
            isAuthenticated: true, 
            isLoading: false 
          });

          return { 
            success: true, 
            user: userWithSurname 
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Signup failed. Please try again.';
          console.error('Signup error:', error);
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return { 
            success: false, 
            error: errorMessage 
          };
        }
      },

      fetchUser: async (userId: string) => {
        try {
          set({ isLoading: true, error: null });
          console.log('[FETCH_USER] Called with userId:', userId);
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          console.log('[FETCH_USER] Supabase result:', { data, error });

          if (error) throw error;
          if (!data) throw new Error('User not found');

          // Ensure the user object has all required fields
          const userWithSurname = {
            ...data,
            surname: data.surname || 'User', // Provide a default surname if missing
          };

          set({ user: userWithSurname });
          console.log('[FETCH_USER] User set in store:', userWithSurname);
        } catch (error) {
          console.error('[FETCH_USER] Error fetching user:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to fetch user' });
        } finally {
          set({ isLoading: false });
          console.log('[FETCH_USER] isLoading set to false');
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({ 
            session: null, 
            user: null, 
            isAuthenticated: false 
          });
        } catch (error) {
          console.error('Error during logout:', error);
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these fields
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Auth state change subscription reference
let authStateChangeUnsubscribe: (() => void) | null = null;

// Initialize auth state listener
export const initializeAuth = () => {
  // Clean up any existing listener
  if (authStateChangeUnsubscribe) {
    try {
      authStateChangeUnsubscribe();
    } catch (error) {
      console.error('Error cleaning up auth subscription:', error);
    }
    authStateChangeUnsubscribe = null;
  }

  // Set up the auth state change listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      const { setSession } = useAuthStore.getState();
      console.log('Auth state changed:', event);
      
      try {
        if (session) {
          setSession(session);
        } else {
          setSession(null);
          useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
      }
    }
  );

  // Store the unsubscribe function directly
  authStateChangeUnsubscribe = () => {
    subscription?.unsubscribe();
  };

  // Return cleanup function
  return () => {
    if (authStateChangeUnsubscribe) {
      try {
        authStateChangeUnsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from auth changes:', error);
      }
      authStateChangeUnsubscribe = null;
    }
  };
};

// Hook to use the auth store with proper initialization
export const useAuth = () => {
  useEffect(() => {
    const cleanup = initializeAuth();
    return () => {
      cleanup();
    };
  }, []);
  
  return useAuthStore();
};