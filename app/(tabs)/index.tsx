import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';

import StockList from '@/components/StockList';
import PortfolioSummary from '@/components/PortfolioSummary';
import TradingModal from '@/components/TradingModal';
import Colors from '@/constants/colors';
import { Stack } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';
import { useAuthStore } from '@/stores/auth-store';

// Home screen component for the main dashboard
export default function HomeScreen() {
  const { user } = useAuthStore();
  const [showTradingModal, setShowTradingModal] = useState(false);
  // Only render portfolio components if user is logged in
  if (!user?.id) {
    return null; // or a loading spinner
  }
  return (
    <View style={styles.container} testID="home-screen">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <Stack.Screen 
        options={{
          headerTitle: "", // Empty string to remove FinBuddy text
          headerLeft: () => null,
          headerRight: () => (
            <View style={styles.headerRightIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Icon name="history" size={20} color={Colors.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Icon name="dollar-sign" size={20} color={Colors.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Icon name="bell" size={20} color={Colors.secondaryText} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <PortfolioSummary />
        <StockList />
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowTradingModal(true)}
      >
        <Icon name="plus" size={24} color={Colors.background} />
      </TouchableOpacity>
      
      <TradingModal
        visible={showTradingModal}
        onClose={() => setShowTradingModal(false)}
        onTradeComplete={() => {
          // Portfolio will refresh automatically via TRPC invalidation
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});