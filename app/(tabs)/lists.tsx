import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, StatusBar } from 'react-native';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

const METALS = [
  { name: 'Gold', symbol: 'XAUUSD' },
  { name: 'Silver', symbol: 'XAGUSD' },
  { name: 'Platinum', symbol: 'XPTUSD' },
  { name: 'Palladium', symbol: 'XPDUSD' },
];

const FINNHUB_API_KEY = 'd19h4vpr01qmm7tv5o0gd19h4vpr01qmm7tv5o10';

async function fetchMetalQuote(symbol: string) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

export default function ListsScreen() {
  const { user } = useAuthStore();
  if (!user?.id) {
    return null; // or a loading spinner
  }
  const [quotes, setQuotes] = useState<Record<string, any>>({});

  useEffect(() => {
    let isMounted = true;
    async function fetchAll() {
      const results: Record<string, any> = {};
      await Promise.all(
        METALS.map(async (metal) => {
          try {
            const data = await fetchMetalQuote(metal.symbol);
            results[metal.symbol] = data;
          } catch (e) {
            results[metal.symbol] = null;
          }
        })
      );
      if (isMounted) setQuotes(results);
    }
    fetchAll();
    const interval = setInterval(fetchAll, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const renderItem = ({ item }: { item: typeof METALS[0] }) => {
    const quote = quotes[item.symbol];
    const price = quote?.c ?? '—';
    const change = quote ? (quote.c - quote.pc) : null;
    const isPositive = change !== null && change >= 0;
    return (
      <View style={styles.row}>
        <View style={styles.cellName}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.symbol}>{item.symbol}</Text>
        </View>
        <Text style={styles.price}>{price !== '—' ? `$${price}` : '—'}</Text>
        <Text style={[styles.change, { color: isPositive ? Colors.secondary : Colors.negative }]}>
          {change !== null ? `${isPositive ? '+' : ''}${change.toFixed(2)}` : '—'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <Text style={styles.title}>Metals & Commodities</Text>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.headerName]}>Name</Text>
        <Text style={styles.headerCell}>Price</Text>
        <Text style={styles.headerCell}>Change</Text>
      </View>
      <FlatList
        data={METALS}
        renderItem={renderItem}
        keyExtractor={item => item.symbol}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Theme.spacing.lg,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  headerCell: {
    flex: 1,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.secondaryText,
    fontSize: Theme.typography.sizes.sm,
    textAlign: 'center',
  },
  headerName: {
    flex: 2,
    textAlign: 'left',
  },
  listContent: {
    paddingBottom: Theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cellName: {
    flex: 2,
  },
  name: {
    fontSize: Theme.typography.sizes.md,
    color: Colors.text,
  },
  symbol: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
  },
  price: {
    flex: 1,
    fontSize: Theme.typography.sizes.md,
    color: Colors.text,
    textAlign: 'center',
  },
  change: {
    flex: 1,
    fontSize: Theme.typography.sizes.md,
    textAlign: 'center',
  },
});