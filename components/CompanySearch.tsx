import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
import { trpc } from '@/lib/trpc';

export type Company = {
  id: string | number;
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  marketCap?: string;
  price?: number;
  change?: number;
  changePercentage?: number;
  type?: string;
  description?: string;
};

export default function CompanySearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const router = useRouter();

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use TRPC to search stocks via Finnhub
  const { data: searchResults = [], isLoading, error } = trpc.stocks.searchStocks.useQuery(
    { query: debouncedQuery },
    { 
      enabled: debouncedQuery.trim().length > 0,
      retry: 2,
      staleTime: 30000, // Cache results for 30 seconds
    }
  );

  // Transform Finnhub search results to match Company interface
  const companies: Company[] = searchResults.map((result: any) => ({
    id: result.symbol,
    symbol: result.symbol,
    name: result.description || result.symbol,
    description: result.description,
    type: result.type,
    price: result.price,
    change: result.change,
    changePercentage: result.changePercent,
    sector: undefined, // Finnhub search doesn't provide sector/industry in basic search
    industry: undefined,
    marketCap: undefined,
  }));

  const handleBuy = (companyId: Company['id']) => {
    router.push(`/place-order?id=${companyId}&action=buy`);
  };

  const handleSell = (companyId: Company['id']) => {
    router.push(`/place-order?id=${companyId}&action=sell`);
  };

  const renderCompanyItem = ({ item }: { item: Company }) => {
    const isPositive = (item.change ?? 0) >= 0;
    return (
      <View style={styles.companyItem}>
        <TouchableOpacity
          style={styles.companyInfoContainer}
          onPress={() => router.push(`/key-data?id=${item.id}`)}
        >
          <View style={styles.companyInfo}>
            <Text style={styles.companySymbol}>{item.symbol}</Text>
            <Text style={styles.companyName}>{item.name}</Text>
            {item.type && (
              <Text style={styles.companySector}>{item.type}</Text>
            )}
          </View>
          <View style={styles.companyPriceInfo}>
            <Text style={styles.companyPrice}>
              {item.price !== undefined && item.price !== null ? `$${item.price.toFixed(2)}` : 'N/A'}
            </Text>
            <Text
              style={[
                styles.companyChange,
                { color: isPositive ? Colors.secondary : Colors.negative },
              ]}
            >
              {item.change !== undefined && item.change !== null && item.changePercentage !== undefined && item.changePercentage !== null
                ? `${isPositive ? '+' : ''}${item.change.toFixed(2)} (${isPositive ? '+' : ''}${item.changePercentage.toFixed(2)}%)`
                : 'N/A'}
            </Text>
            {item.marketCap && (
              <Text style={styles.companyMarketCap}>
                Market Cap: {item.marketCap}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.buyButton} onPress={() => handleBuy(item.id)}>
            <Text style={styles.buyButtonText}>BUY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sellButton} onPress={() => handleSell(item.id)}>
            <Text style={styles.sellButtonText}>SELL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const showNoResults = debouncedQuery.trim().length > 0 && !isLoading && companies.length === 0;
  const showInitialState = debouncedQuery.trim().length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color={Colors.secondaryText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stocks (e.g., AAPL, Tesla)..."
            placeholderTextColor={Colors.secondaryText}
            value={searchQuery}
            onChangeText={(text) => {
              console.log('Search input:', text);
              setSearchQuery(text);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Icon name="x" size={16} color={Colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showInitialState ? (
        <View style={styles.initialStateContainer}>
          <Icon name="search" size={48} color={Colors.secondaryText} />
          <Text style={styles.initialStateText}>Search for stocks by symbol or company name</Text>
          <Text style={styles.initialStateSubtext}>Try searching for "AAPL", "Tesla", or "Microsoft"</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching stocks...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={Colors.negative} />
          <Text style={styles.errorText}>Error searching stocks</Text>
          <Text style={styles.errorSubtext}>Please try again or check your connection</Text>
        </View>
      ) : showNoResults ? (
        <View style={styles.noResultsContainer}>
          <Icon name="search" size={48} color={Colors.secondaryText} />
          <Text style={styles.noResultsText}>No stocks found matching "{debouncedQuery}"</Text>
          <Text style={styles.noResultsSubtext}>Try searching for a different symbol or company name</Text>
        </View>
      ) : (
        <FlatList
          data={companies}
          renderItem={renderCompanyItem}
          keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: Theme.spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.typography.sizes.md,
    color: Colors.text,
    height: '100%',
  },
  clearButton: {
    padding: Theme.spacing.xs,
  },
  listContent: {
    padding: Theme.spacing.md,
  },
  companyItem: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.small,
  },
  companyInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Theme.spacing.md,
  },
  companyInfo: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  companySymbol: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold as any,
    color: Colors.text,
  },
  companyName: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.text,
    marginTop: 2,
  },
  companySector: {
    fontSize: Theme.typography.sizes.xs,
    color: Colors.secondaryText,
    marginTop: 4,
  },
  companyPriceInfo: {
    alignItems: 'flex-end',
  },
  companyPrice: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.text,
  },
  companyChange: {
    fontSize: Theme.typography.sizes.sm,
    marginTop: 2,
  },
  companyMarketCap: {
    fontSize: Theme.typography.sizes.xs,
    color: Colors.secondaryText,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Theme.spacing.sm,
    padding: Theme.spacing.sm,
    paddingTop: 0,
    justifyContent: 'space-between',
  },
  buyButton: {
    flex: 1,
    backgroundColor: Colors.secondary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  buyButtonText: {
    color: Colors.background,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold as any,
  },
  sellButton: {
    flex: 1,
    backgroundColor: Colors.negative,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
  },
  sellButtonText: {
    color: Colors.background,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold as any,
  },
  loadingContainer: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.sm,
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
  },
  noResultsContainer: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: Theme.typography.sizes.md,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginTop: Theme.spacing.xs,
  },
  initialStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialStateText: {
    fontSize: Theme.typography.sizes.lg,
    color: Colors.text,
    marginTop: Theme.spacing.sm,
    textAlign: 'center',
  },
  initialStateSubtext: {
    fontSize: Theme.typography.sizes.md,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Theme.typography.sizes.lg,
    color: Colors.negative,
    marginTop: Theme.spacing.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: Theme.typography.sizes.md,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});