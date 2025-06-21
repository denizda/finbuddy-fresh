import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
// import { portfolioSummary, portfolioTimeFrames } from '@/mocks/portfolio'; // Keep for now if fallback is needed, or remove
import SimplePieChart, { getColorForIndex } from './SimplePieChart';
import { trpc } from '@/lib/trpc'; // Import trpc
import { useAuthStore } from '@/stores/auth-store'; // Import auth store

type TimeFrame = 'today' | 'week' | 'month' | 'ytd' | 'year' | 'all';

// Fallback for missing portfolioTimeFrames
const portfolioTimeFrames: Record<string, any> = {};

export default function PortfolioSummaryAlternative() {
  const { user } = useAuthStore();
  if (!user?.id) return null;
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('today');

  // Fetch portfolio data using tRPC
  const { data, isLoading, error } = trpc.useQuery([
    'portfolio.getPortfolio',
    { userId: user.id }
  ], {
    enabled: true
  });

  // Use fetched data or fall back to mock if data is not available yet
  const currentPortfolioSummary = data?.summary || { totalValue: 0, dailyChange: 0, dailyChangePercentage: 0, allocation: [] };
  const currentAllocation = data?.summary.allocation || { totalValue: 0, dailyChange: 0, dailyChangePercentage: 0, allocation: [] };
  const currentPortfolioItems = data?.portfolioItems || [];

  const handleTimeFrameChange = useCallback((timeFrame: TimeFrame) => {
    setSelectedTimeFrame(timeFrame);
  }, []);
  
  const timeFrameData = portfolioTimeFrames[selectedTimeFrame];
  const isPositive = timeFrameData.change >= 0;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Portfolio...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Error loading portfolio: {error.message}</Text>
        <Text style={styles.errorText}>Please check your network and Supabase configuration.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Portfolio Value</Text>
        <Text style={styles.value}>${currentPortfolioSummary.totalValue.toLocaleString()}</Text>
        
        {/* Time frame selector */}
        <View style={styles.timeFrameSelector}>
          {Object.entries(portfolioTimeFrames).map(([key, data]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.timeFrameButton,
                selectedTimeFrame === key && styles.selectedTimeFrameButton
              ]}
              onPress={() => handleTimeFrameChange(key as TimeFrame)}
            >
              <Text 
                style={[
                  styles.timeFrameButtonText,
                  selectedTimeFrame === key && styles.selectedTimeFrameButtonText
                ]}
              >
                {data.label ?? ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.changeContainer}>
          <View style={[styles.changeBox, { backgroundColor: isPositive ? 'rgba(0, 208, 156, 0.1)' : 'rgba(255, 92, 92, 0.1)' }]}>
            {isPositive ? (
              <Icon name="arrow-up-right" size={16} color={Colors.secondary} />
            ) : (
              <Icon name="arrow-down-right" size={16} color={Colors.negative} />
            )}
            <Text style={[styles.changeText, { color: isPositive ? Colors.secondary : Colors.negative }]}>
              ${Math.abs(timeFrameData.change).toLocaleString()} ({Math.abs(timeFrameData.changePercentage).toFixed(2)}%)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.allocationContainer}>
        <Text style={styles.allocationTitle}>Asset Allocation</Text>
        <View style={styles.donutChartContainer}>
          <SimplePieChart data={currentAllocation} />
        </View>

        <View style={styles.legendContainer}>
          {currentAllocation.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: getColorForIndex(index) }]} />
              <Text style={styles.legendText}>{item.category}</Text>
              <Text style={styles.legendPercentage}>{item.percentage}%</Text>
            </View>
          ))}
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
  timeFrameSelector: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.md,
    flexWrap: 'wrap',
    gap: 8,
  },
  timeFrameButton: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedTimeFrameButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeFrameButtonText: {
    fontSize: Theme.typography.sizes.xs,
    color: Colors.text,
  },
  selectedTimeFrameButtonText: {
    color: Colors.background,
    fontWeight: Theme.typography.weights.medium as any,
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
  allocationContainer: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.medium,
  },
  allocationTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  donutChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Theme.spacing.md,
  },
  legendContainer: {
    marginTop: Theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Theme.spacing.sm,
  },
  legendText: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.text,
    flex: 1,
  },
  legendPercentage: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium as any,
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200, // Ensure it takes up some space while loading
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    color: Colors.text,
    fontSize: Theme.typography.sizes.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200, // Ensure it takes up some space while displaying error
    padding: Theme.spacing.md,
  },
  errorText: {
    color: Colors.negative,
    fontSize: Theme.typography.sizes.md,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
});