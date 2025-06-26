import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from '@react-navigation/native';
import TradingViewChart from '@/components/TradingViewChart';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth-store';
import { useOrientation } from '@/contexts/OrientationContext';

// Graphics screen component for displaying trading charts
export default function GraphicsScreen() {
  const [selectedStockIndex, setSelectedStockIndex] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const router = useRouter();
  const { user } = useAuthStore();
  const { isLandscape, setChartsScreenLandscape } = useOrientation();

  // Update charts screen landscape state when orientation changes
  useEffect(() => {
    setChartsScreenLandscape(isLandscape);
  }, [isLandscape, setChartsScreenLandscape]);

  // Enable landscape mode when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Allow all orientations when this screen is active
      ScreenOrientation.unlockAsync();
      
      return () => {
        // Lock back to portrait when leaving this screen
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        // Reset charts screen landscape state
        setChartsScreenLandscape(false);
      };
    }, [setChartsScreenLandscape])
  );
  
  const timeframes = ['1D', '1W', '1M', '3M', '1Y', '5Y'];

  if (!user?.id) return null;

  // Fetch portfolio data
  const { data: portfolioData, isLoading: isLoadingPortfolio } = trpc.useQuery([
    'portfolio.getPortfolio',
    { userId: user.id }
  ], {
    enabled: true
  });

  const stocks = portfolioData?.portfolioItems || [];
  const selectedStock = stocks[selectedStockIndex] || null;

  // Fetch real-time prices for all stocks
  const symbols = stocks.map((s) => s.symbol);
  const { data: realtimePrices, isLoading: isLoadingPrices } = trpc.useQuery([
    'portfolio.getRealtimePrices',
    { symbols }
  ], {
    enabled: symbols.length > 0
  });

  // Show loading state
  if (isLoadingPortfolio) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading portfolio...</Text>
      </View>
    );
  }

  // Show empty state if no stocks
  if (!stocks.length) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyStateText}>No stocks in your portfolio</Text>
        <Text style={styles.emptyStateSubText}>Add some stocks to view charts</Text>
      </View>
    );
  }

  // Update selectedStock with real-time price if available
  const selectedStockWithRealtime = selectedStock ? {
    ...selectedStock,
    price: realtimePrices?.[selectedStock.symbol]?.currentPrice ?? selectedStock.realtimePrice ?? selectedStock.price ?? 0,
    change: realtimePrices?.[selectedStock.symbol]?.change ?? 0,
    changePercentage: realtimePrices?.[selectedStock.symbol]?.changePercent ?? 0,
    shares: selectedStock.quantity,
    value: selectedStock.currentTotalValue,
  } : null;

  if (!selectedStockWithRealtime) return null;

  if (isLandscape) {
    // Landscape mode: Show only the chart
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.chartContainerFullscreen}>
          <TradingViewChart 
            symbol={`NASDAQ:${selectedStock.symbol}`} 
            interval={selectedTimeframe}
            height={Dimensions.get('window').height - 100}
          />
        </View>
      </View>
    );
  }

  // Portrait mode: Show full interface
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.chartContainer}>
          <TradingViewChart 
            symbol={`NASDAQ:${selectedStock.symbol}`} 
            interval={selectedTimeframe}
            height={500}
          />
        </View>

        <View style={styles.timeframeContainer}>
          {timeframes.map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe && styles.selectedTimeframeButton
              ]}
              onPress={() => setSelectedTimeframe(timeframe)}
            >
              <Text 
                style={[
                  styles.timeframeText,
                  selectedTimeframe === timeframe && styles.selectedTimeframeText
                ]}
              >
                {timeframe}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Popular Stocks</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stocksScrollContent}
        >
          {stocks.map((stock) => (
            <TouchableOpacity
              key={stock.id}
              style={[
                styles.stockCard,
                selectedStock?.id === stock.id && styles.selectedStockCard
              ]}
              onPress={() => setSelectedStockIndex(stocks.indexOf(stock))}
            >
              <View style={[styles.stockIconContainer, { backgroundColor: `${Colors.primary}20` }]}>
                <Text style={[styles.stockIcon, { color: Colors.primary }]}>{stock.symbol.charAt(0)}</Text>
              </View>
              <Text style={styles.stockSymbol}>{stock.symbol}</Text>
              <Text 
                style={[
                  styles.stockChange, 
                  { color: Colors.secondary }
                ]}
              >
                +0.00%
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.stockInfoContainer}>
          <View style={styles.stockInfoHeader}>
            <Text style={styles.stockInfoName}>{selectedStockWithRealtime.name}</Text>
            <Text style={styles.stockInfoSymbol}>NASDAQ: {selectedStockWithRealtime.symbol}</Text>
          </View>
          
          <View style={styles.stockInfoDetails}>
            <View style={styles.stockInfoItem}>
              <Text style={styles.stockInfoLabel}>Price</Text>
              <Text style={styles.stockInfoValue}>
                {isLoadingPrices ? 'Loading...' : `$${(selectedStockWithRealtime.price || 0).toFixed(2)}`}
              </Text>
            </View>
            <View style={styles.stockInfoItem}>
              <Text style={styles.stockInfoLabel}>Change</Text>
              <Text 
                style={[
                  styles.stockInfoValue, 
                  { color: (selectedStockWithRealtime.change || 0) >= 0 ? Colors.secondary : Colors.negative }
                ]}
              >
                {(selectedStockWithRealtime.change || 0) >= 0 ? '+' : ''}${(selectedStockWithRealtime.change || 0).toFixed(2)} ({(selectedStockWithRealtime.change || 0) >= 0 ? '+' : ''}{(selectedStockWithRealtime.changePercentage || 0).toFixed(2)}%)
              </Text>
            </View>
            <View style={styles.stockInfoItem}>
              <Text style={styles.stockInfoLabel}>Shares</Text>
              <Text style={styles.stockInfoValue}>{selectedStockWithRealtime.shares}</Text>
            </View>
            <View style={styles.stockInfoItem}>
              <Text style={styles.stockInfoLabel}>Value</Text>
              <Text style={styles.stockInfoValue}>${(selectedStockWithRealtime.value || 0).toFixed(2)}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.keyDataButton}
            onPress={() => router.push(`/key-data?id=${selectedStockWithRealtime.id}`)}
          >
            <Text style={styles.keyDataButtonText}>View Key Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chartContainer: {
    marginTop: Theme.spacing.xs,
    marginBottom: Theme.spacing.md,
  },
  chartContainerLandscape: {
    marginTop: 0,
    marginBottom: Theme.spacing.xs,
  },
  chartContainerFullscreen: {
    flex: 1,
    margin: 0,
    padding: 0,
  },
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  timeframeButton: {
    paddingVertical: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.card,
    minWidth: 40,
    alignItems: 'center',
  },
  selectedTimeframeButton: {
    backgroundColor: Colors.primary,
  },
  timeframeText: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.text,
  },
  selectedTimeframeText: {
    color: Colors.background,
    fontWeight: Theme.typography.weights.medium as any,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.text,
    marginHorizontal: Theme.spacing.md,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  stocksScrollContent: {
    paddingHorizontal: Theme.spacing.md,
  },
  stockCard: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginRight: Theme.spacing.md,
    alignItems: 'center',
    width: 100,
    ...Theme.shadows.small,
  },
  selectedStockCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  stockIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  stockIcon: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold as any,
  },
  stockSymbol: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.text,
    marginBottom: 4,
  },
  stockChange: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.medium as any,
  },
  stockInfoContainer: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    margin: Theme.spacing.md,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.medium,
  },
  stockInfoHeader: {
    marginBottom: Theme.spacing.md,
  },
  stockInfoName: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold as any,
    color: Colors.text,
  },
  stockInfoSymbol: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  stockInfoDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Theme.spacing.md,
  },
  stockInfoItem: {
    width: '50%',
    marginBottom: Theme.spacing.md,
  },
  stockInfoLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  stockInfoValue: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.text,
  },
  keyDataButton: {
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
  },
  keyDataButtonText: {
    color: Colors.background,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium as any,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    color: Colors.text,
    fontSize: Theme.typography.sizes.md,
  },
  emptyStateText: {
    color: Colors.text,
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold as any,
  },
  emptyStateSubText: {
    color: Colors.secondaryText,
    fontSize: Theme.typography.sizes.sm,
    marginTop: Theme.spacing.xs,
  },
});