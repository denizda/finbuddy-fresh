"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ActivityIndicator, Platform, Linking } from 'react-native';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from 'expo-font';
import { Stack, useSegments, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { useAuthStore } from "@/stores/auth-store";
import ErrorBoundary from "./error-boundary";
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { OrientationProvider } from '@/contexts/OrientationContext';
import * as SubscriptionService from '@/services/revenueCat';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

// This is a type-only import
import type { Router } from 'expo-router';

declare module 'expo-router' {
  export const unstable_settings: {
    initialRouteName: string;
  };
}

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Create a client for React Query
const queryClient = new QueryClient();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Deep linking configuration
const linking = {
  prefixes: ['finbuddy://', 'https://rork.app'],
  config: {
    screens: {
      '(auth)': {
        path: 'auth',
        screens: {
          'email-confirm': 'confirm',
        },
      },
    },
  },
};

// Component to handle auth state changes and navigation
function AuthStateHandler() {
  const { session, user, fetchUser, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const lastSessionUserId = useRef<string | null>(null);
  const navigationInProgress = useRef(false);
  const initialNavigationDone = useRef(false);

  // Only fetch user if session user id changes and we don't have user data
  useEffect(() => {
    if (session?.user?.id && lastSessionUserId.current !== session.user.id) {
      lastSessionUserId.current = session.user.id;
      if (!user || user.id !== session.user.id) {
        fetchUser(session.user.id);
      }
    }
  }, [session, user, fetchUser]);

  // Handle navigation based on auth state
  useEffect(() => {
    // Skip if still loading initial data or navigation is in progress
    if (isLoading || navigationInProgress.current) return;

    // Check if we're in the auth group or at root
    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)';
    // Check if we're at root by checking if we have no segments or if the first segment is empty
    const atRoot = !segments.length || !firstSegment;
    
    console.log('[AUTH_STATE_HANDLER] session:', !!session, 'user:', !!user, 'segments:', segments, 'inAuthGroup:', inAuthGroup);
    
    type RoutePath = '/(tabs)' | '/(auth)/login';
    
    const navigateTo = async (route: RoutePath) => {
      console.log(`[AUTH_STATE_HANDLER] Navigating to ${route}`);
      navigationInProgress.current = true;
      try {
        await router.replace(route as any); // Type assertion needed for now
      } catch (error) {
        console.error('Navigation error:', error);
      } finally {
        navigationInProgress.current = false;
        if (route === '/(tabs)') {
          initialNavigationDone.current = true;
        }
      }
    };
    
    // If we have both session and user
    if (session && user) {
      // Only navigate if we're in auth group or at root
      if (inAuthGroup || atRoot) {
        navigateTo('/(tabs)');
      }
    } 
    // If no session or user
    else if (!session || !user) {
      // Only navigate if we're not already in auth group
      if (!inAuthGroup && (initialNavigationDone.current || atRoot)) {
        navigateTo('/(auth)/login');
      }
    }
  }, [session, user, segments, isLoading, router]);

  return null;
}

// Root layout component for the entire app
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...FontAwesome.font,
  });
  
  // No need to load SpaceMono, we'll use system font
  
  const pathname = usePathname();
  const router = useRouter();
  const [isDeepLinkInitialized, setIsDeepLinkInitialized] = useState(false);

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      
      try {
        const parsedUrl = new URL(url);
        
        // Handle Supabase email confirmation
        if (parsedUrl.hash.includes('type=signup') && parsedUrl.hash.includes('access_token')) {
          // Extract the access token from the URL
          const accessToken = new URLSearchParams(parsedUrl.hash.substring(1)).get('access_token');
          if (accessToken) {
            // Sign in with the access token
            const { error } = await supabase.auth.verifyOtp({
              token_hash: accessToken,
              type: 'signup'
            });
            
            if (!error) {
              // Navigate to the home screen after successful confirmation
              router.replace('/(tabs)');
            }
          }
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    };
    
    // Handle the initial URL if the app was opened from a link
    const setupDeepLinks = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleDeepLink(initialUrl);
      }
      setIsDeepLinkInitialized(true);
    };
    
    setupDeepLinks();
    
    // Listen for deep links when the app is in the foreground
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });
    
    return () => {
      subscription.remove();
    };
  }, [router]);
  const { session, setSession, fetchUser } = useAuthStore();
  const [appInitialized, setAppInitialized] = useState(false);

  // Set up auth state listener
  useEffect(() => {
    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      }
    }
    
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user?.id) {
        await fetchUser(session.user.id);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Initialize app and services
  useEffect(() => {
    async function prepare() {
      try {
        // Initialize RevenueCat
        await SubscriptionService.initializeRevenueCat();
      } catch (error) {
        console.warn('Failed to initialize RevenueCat', error);
      } finally {
        setAppInitialized(true);
        if (fontsLoaded) {
          await SplashScreen.hideAsync();
        }
      }
    }

    prepare();
  }, [fontsLoaded]);

  // Handle font loading errors
  useEffect(() => {
    if (fontError) {
      console.error('Font loading error:', fontError);
    }
  }, [fontError]);

  // Show nothing until everything is ready
  if (!fontsLoaded || !appInitialized) {
    return null;
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <OrientationProvider>
          <SubscriptionProvider>
            <ErrorBoundary>
              <RootLayoutNav />
            </ErrorBoundary>
          </SubscriptionProvider>
        </OrientationProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    console.log('[NAV] isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'segments:', segments, 'inAuthGroup:', inAuthGroup);
    if (!isLoading) {
      if (isAuthenticated && inAuthGroup) {
        console.log('[NAV] Redirecting to /tabs');
        router.replace('/(tabs)');
      } else if (!isAuthenticated && !inAuthGroup) {
        console.log('[NAV] Redirecting to /auth/login');
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading, segments, initialized]);

  if (isLoading || !initialized) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: Colors.background 
      }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <AuthStateHandler />
      <Stack
        screenOptions={{
          headerBackTitle: 'Back',
          headerTintColor: Colors.primary,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="(auth)" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="edit-profile" 
          options={{ 
            title: 'Edit Profile',
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="subscription" 
          options={{ 
            title: 'Subscription',
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="place-order" 
          options={{ 
            title: 'Place Order',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="key-data" 
          options={{ 
            title: 'Key Data',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="modal" 
          options={{ 
            title: 'Info',
            presentation: 'modal'
          }} 
        />
      </Stack>
    </>
  );
}