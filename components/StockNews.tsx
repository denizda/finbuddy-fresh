import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
import Icon from 'react-native-vector-icons/Feather';

interface StockNewsProps {
  symbol: string;
}

interface NewsItem {
  id: string;
  title: string;
  link: string;
  summary?: string;
  published_at: string;
  source: string;
}

export default function StockNews({ symbol }: StockNewsProps) {
  // Temporarily disable to fix build - will re-enable once types are working
  const news: NewsItem[] = [];
  const isLoading = false;
  const error = null;
  const refetch = () => {};
  
  // TODO: Re-enable once tRPC types are fixed
  // const { data: news, isLoading, error, refetch } = trpc.stocks.getNews.useQuery(
  //   { symbol, limit: 20 },
  //   {
  //     refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  //   }
  // );

  const handleNewsPress = async (link: string) => {
    try {
      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      } else {
        Alert.alert('Error', 'Unable to open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      style={styles.newsItem}
      onPress={() => handleNewsPress(item.link)}
      activeOpacity={0.7}
    >
      <View style={styles.newsHeader}>
        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.newsTime}>
          {formatDate(item.published_at)}
        </Text>
      </View>
      
      {item.summary && (
        <Text style={styles.newsSummary} numberOfLines={3}>
          {item.summary}
        </Text>
      )}
      
      <View style={styles.newsFooter}>
        <Text style={styles.newsSource}>{item.source}</Text>
        <Icon name="external-link" size={14} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading news...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={Colors.negative} />
        <Text style={styles.errorText}>Failed to load news</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!news || news.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="file-text" size={48} color={Colors.secondaryText} />
        <Text style={styles.emptyText}>No news available for {symbol}</Text>
        <Text style={styles.emptySubtext}>
          News will appear here when our automated system finds relevant articles
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Latest News for {symbol}</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Icon name="refresh-cw" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  listContainer: {
    padding: 16,
  },
  newsItem: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  newsTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 12,
    lineHeight: 22,
  },
  newsTime: {
    fontSize: 12,
    color: Colors.secondaryText,
    minWidth: 60,
    textAlign: 'right',
  },
  newsSummary: {
    fontSize: 14,
    color: Colors.secondaryText,
    lineHeight: 20,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsSource: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  separator: {
    height: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.secondaryText,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.negative,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.md,
  },
  retryButtonText: {
    color: Colors.background,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
}); 