import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import SubscriptionManager from '@/components/SubscriptionManager';
import Colors from '@/constants/colors';

export default function SubscriptionScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Premium Subscription',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: Colors.background,
          },
        }} 
      />
      <SubscriptionManager />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
}); 