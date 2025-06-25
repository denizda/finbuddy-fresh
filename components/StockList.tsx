import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth-store';
import TradingModal from '@/components/TradingModal';

interface PortfolioItem {
  id: string; // Supabase UUIDs are strings
  quantity: number;
  averageCost: number;
  currentTotalValue: number;
  symbol: string;
  name: string;
  realtimePrice?: number;
}

export default function StockList() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedStock, setSelectedStock] = useState<PortfolioItem | null>(null);
  const [showTradingModal, setShowTradingModal] = useState(false);
  console.log('StockList user?.id:', user?.id);

  if (!user?.id) return null; // or a loading spinner

  const { data, isLoading, error, refetch } = trpc.useQuery([
    'portfolio.getPortfolio',
    { userId: user.id }
  ], {
    enabled: true,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const portfolioItems: PortfolioItem[] = data?.portfolioItems || []; // Explicitly type the fetched data
  const totalPortfolioValue = data?.summary.totalValue || 0;

  // Get real-time prices for all stocks
  const symbols = portfolioItems.map(item => item.symbol);
  const { data: realtimePrices, isLoading: isPricesLoading } = trpc.useQuery([
    'portfolio.getRealtimePrices',
    { symbols }
  ], {
    enabled: symbols.length > 0,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const renderStockItem = ({ item }: { item: PortfolioItem }) => {
    // Get real-time price data
    const priceData = realtimePrices?.[item.symbol];
    const currentPrice = priceData?.currentPrice || item.realtimePrice || 0;
    const dailyChange = priceData?.change || 0;
    const dailyChangePercent = priceData?.changePercent || 0;
    
    // Calculate portfolio percentage
    const currentValue = currentPrice * item.quantity;
    const portfolioPercentage = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;

    const isPositive = dailyChange >= 0;

    return (
      <Pressable
        style={styles.stockItem}
        onPress={() => router.push(`/key-data?id=${item.id}`)}
      >
        <View style={styles.stockInfo}>
          <View style={[styles.stockIconContainer, { backgroundColor: `${Colors.primary}20` }]}>
            <Text style={[styles.stockIcon, { color: Colors.primary }]}>{item.symbol.charAt(0)}</Text>
          </View>
          <View style={styles.stockDetails}>
            <Text style={styles.stockSymbol}>{item.symbol}</Text>
            <Text style={styles.stockName}>{item.name}</Text>
            <Text style={styles.stockShares}>
              {item.quantity} shares • {portfolioPercentage.toFixed(1)}% of portfolio
            </Text>
          </View>
        </View>
        
        <View style={styles.stockRightSection}>
          <View style={styles.stockPriceContainer}>
            <Text style={styles.stockPrice}>
              ${currentPrice > 0 ? currentPrice.toFixed(2) : 'N/A'}
              {isPricesLoading && <Text style={styles.loadingIndicator}> ⟳</Text>}
            </Text>
            <Text style={styles.stockValue}>${currentValue.toFixed(2)}</Text>
            <View style={styles.stockChangeContainer}>
              {isPositive ? (
                <Icon name="arrow-up-right" size={12} color={Colors.secondary} />
              ) : (
                <Icon name="arrow-down-right" size={12} color={Colors.negative} />
              )}
              <Text 
                style={[
                  styles.stockChange, 
                  { color: isPositive ? Colors.secondary : Colors.negative }
                ]}
              >
                {isPositive ? '+' : ''}{dailyChangePercent.toFixed(2)}%
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.tradeButton}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedStock({
                ...item,
                realtimePrice: currentPrice
              });
              setShowTradingModal(true);
            }}
          >
            <Text style={styles.tradeButtonText}>Trade</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Stocks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Error loading stocks: {error.message}</Text>
        <Text style={styles.errorText}>Please ensure your Supabase database is set up correctly and accessible.</Text>
      </View>
    );
  }

  if (!portfolioItems || portfolioItems.length === 0) {
    return (
      <View style={[styles.container, styles.emptyStateContainer]}>
        <Icon name="package" size={50} color={Colors.secondaryText} />
        <Text style={styles.emptyStateText}>No stocks in your portfolio yet.</Text>
        <Text style={styles.emptyStateSubText}>Add some stocks to get started!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Stocks</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/graphics')}
        >
          <Icon name="trending-up" size={14} color={Colors.primary} />
          <Text style={styles.viewAllText}>View Charts</Text>
        </TouchableOpacity>
      </View>

      <FlatList<PortfolioItem> // Specify the type for FlatList
        data={portfolioItems}
        renderItem={renderStockItem}
        keyExtractor={(item) => item.id} // item.id is already a string (UUID), no need for .toString()
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
      
      {selectedStock && (
        <TradingModal
          visible={showTradingModal}
          onClose={() => {
            setShowTradingModal(false);
            setSelectedStock(null);
          }}
          onTradeComplete={() => {
            // Portfolio will refresh automatically via TRPC invalidation
          }}
          existingStock={{
            symbol: selectedStock.symbol,
            name: selectedStock.name,
            quantity: selectedStock.quantity,
            averageCost: selectedStock.averageCost,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.primary,
    marginLeft: Theme.spacing.xs,
  },
  listContent: {
    paddingBottom: Theme.spacing.sm,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
    // backgroundColor: `${item.color}20`, // Removed item.color as it's not from Supabase
  },
  stockIcon: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold as any,
    // color: item.color, // Removed item.color
  },
  stockDetails: {
    justifyContent: 'center',
  },
  stockSymbol: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.text,
  },
  stockName: {
    fontSize: Theme.typography.sizes.xs,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  stockShares: {
    fontSize: Theme.typography.sizes.xs,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  stockPriceContainer: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.text,
  },
  stockValue: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium as any,
    color: Colors.text,
    marginTop: 2,
  },
  stockChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  stockChange: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.medium as any,
    marginLeft: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150, // Smaller height for this component
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
    minHeight: 150,
    padding: Theme.spacing.md,
  },
  errorText: {
    color: Colors.negative,
    fontSize: Theme.typography.sizes.md,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
    padding: Theme.spacing.md,
  },
  emptyStateText: {
    color: Colors.secondaryText,
    fontSize: Theme.typography.sizes.md,
    marginTop: Theme.spacing.md,
    fontWeight: Theme.typography.weights.semibold as any,
  },
  emptyStateSubText: {
    color: Colors.secondaryText,
    fontSize: Theme.typography.sizes.sm,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
  stockRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  tradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
  },
  tradeButtonText: {
    color: Colors.background,
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.medium as any,
  },
  loadingIndicator: {
    fontSize: Theme.typography.sizes.xs,
    color: Colors.secondaryText,
  },
});