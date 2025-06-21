import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export type Company = {
  id: string | number;
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCap?: string;
  price?: number;
  change?: number;
  changePercentage?: number;
};

export default function CompanySearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('companies').select('*');
      if (error) {
        console.error('Error fetching companies from Supabase:', error);
      } else if (data) {
        console.log('Fetched companies:', data);
        setCompanies(data as Company[]);
        setFilteredCompanies(data as Company[]);
      }
      setIsLoading(false);
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter((company) => {
        const symbol = company.symbol?.toLowerCase() || '';
        const name = company.name?.toLowerCase() || '';
        return symbol.includes(query) || name.includes(query);
      });
      setFilteredCompanies(filtered);
    }
  }, [searchQuery, companies]);

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
            <Text style={styles.companySector}>{item.sector} • {item.industry}</Text>
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
              {item.change !== undefined && item.change !== null
                ? `${isPositive ? '+' : ''}${item.change.toFixed(2)} (${isPositive ? '+' : ''}${(item.changePercentage !== null && item.changePercentage !== undefined) ? item.changePercentage.toFixed(2) : '0.00'}%)`
                : 'N/A'}
            </Text>
            <Text style={styles.companyMarketCap}>
              Market Cap: {item.marketCap ?? 'N/A'}
            </Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color={Colors.secondaryText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search NASDAQ companies..."
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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading companies...</Text>
        </View>
      ) : filteredCompanies.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No companies found matching "{searchQuery}"</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCompanies}
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
});