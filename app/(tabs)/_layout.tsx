import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useOrientation } from '@/contexts/OrientationContext';

// Tab layout component for the main app tabs
export default function TabLayout() {
  const { isChartsScreenLandscape } = useOrientation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.secondaryText,
        tabBarStyle: [
          {
            borderTopColor: Colors.border,
            backgroundColor: Colors.background,
          },
          isChartsScreenLandscape && { display: 'none' }
        ],
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: Colors.text,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="graphics"
        options={{
          title: 'Charts',
          tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={22} color={color} />,
          headerTitle: 'Market Charts',
        }}
      />
      <Tabs.Screen
        name="companies"
        options={{
          title: 'Companies',
          tabBarIcon: ({ color }) => <Feather name="briefcase" size={22} color={color} />,
          headerTitle: 'NASDAQ Companies',
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color }) => <Feather name="file-text" size={22} color={color} />,
          headerTitle: 'Latest Stock News',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
          headerTitle: 'Your Profile',
        }}
      />
    </Tabs>
  );
}