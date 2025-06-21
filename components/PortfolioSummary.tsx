import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth-store';

export default function PortfolioSummary() {
  const { user } = useAuthStore();
  
  if (!user?.id) return null;
  
  const { data: portfolioData, isLoading: isLoadingPortfolio } = trpc.useQuery([
    'portfolio.getPortfolio',
    { userId: user.id }
  ], {
    enabled: true
  });
  
  const { data: accountData, isLoading: isLoadingAccount } = trpc.useQuery([
    'trading.getAccountBalance',
    { userId: user.id }
  ], {
    enabled: true
  });
  
  const portfolioSummary = portfolioData?.summary || { 
    totalValue: 0, 
    dailyChange: 0, 
    dailyChangePercentage: 0 
  };
  
  const isPositive = portfolioSummary.dailyChange >= 0;
  const isLoading = isLoadingPortfolio || isLoadingAccount;
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.label}>Portfolio Value</Text>
            <Text style={styles.value}>${portfolioSummary.totalValue.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.label}>Available Cash</Text>
            <Text style={styles.cashValue}>${(accountData?.availableBalance || 0).toLocaleString()}</Text>
          </View>
        </View>
        
        <View style={styles.changeContainer}>
          <View style={[styles.changeBox, { backgroundColor: isPositive ? 'rgba(0, 208, 156, 0.1)' : 'rgba(255, 92, 92, 0.1)' }]}>
            {isPositive ? (
              <Icon name="arrow-up-right" size={16} color={Colors.secondary} />
            ) : (
              <Icon name="arrow-down-right" size={16} color={Colors.negative} />
            )}
            <Text style={[styles.changeText, { color: isPositive ? Colors.secondary : Colors.negative }]}>
              ${Math.abs(portfolioSummary.dailyChange).toLocaleString()} ({Math.abs(portfolioSummary.dailyChangePercentage).toFixed(2)}%)
            </Text>
          </View>
          <Text style={styles.periodText}>Today</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.medium,
  },
  label: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
    marginBottom: Theme.spacing.xs,
  },
  value: {
    fontSize: Theme.typography.sizes.xxxl,
    fontWeight: Theme.typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  changeText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium as any,
    marginLeft: Theme.spacing.xs,
  },
  periodText: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
  },
  loadingCard: {
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  balanceItem: {
    flex: 1,
  },
  cashValue: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.primary,
    marginTop: Theme.spacing.xs,
  },
});