import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
import Icon from 'react-native-vector-icons/Feather';

interface NewsItem {
  id: string;
  symbol: string;
  title: string;
  link: string;
  summary?: string;
  published_at: string;
  source: string;
  created_at: string;
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export default function NewsScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = async (isRefresh = false, isAutomatic = false) => {
    try {
      if (isRefresh && !isAutomatic) {
        setIsRefreshing(true);
      } else if (!isRefresh && !isAutomatic) {
        setIsLoading(true);
      }
      
      // Don't show loading states for automatic refresh
      if (!isAutomatic) {
        setError(null);
      }

      // Fetch news from your API endpoint
      const response = await fetch('https://finbuddy-fresh-9mom.vercel.app/api/news', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      setNews(data || []);
      setLastUpdated(new Date());
      
      // Clear any previous errors on successful fetch
      if (error) {
        setError(null);
      }
    } catch (err) {
      // Only set error state if it's not an automatic refresh
      if (!isAutomatic) {
        setError(err instanceof Error ? err.message : 'Failed to load news');
      }
    } finally {
      if (!isAutomatic) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchNews();
    
    // Set up automatic refresh every 3 seconds
    const interval = setInterval(() => {
      fetchNews(false, true); // isRefresh=false, isAutomatic=true
    }, 3000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

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

  const getSentimentStyle = (sentiment?: string) => {
    switch (sentiment) {
      case 'BULLISH':
        return {
          color: '#22c55e', // green
          icon: 'trending-up',
          backgroundColor: '#22c55e20',
        };
      case 'BEARISH':
        return {
          color: '#ef4444', // red
          icon: 'trending-down',
          backgroundColor: '#ef444420',
        };
      case 'NEUTRAL':
      default:
        return {
          color: '#6b7280', // gray
          icon: 'minus',
          backgroundColor: '#6b728020',
        };
    }
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => {
    const sentimentStyle = getSentimentStyle(item.sentiment);
    
    return (
      <TouchableOpacity
        style={styles.newsItem}
        onPress={() => handleNewsPress(item.link)}
        activeOpacity={0.7}
      >
        <View style={styles.newsHeader}>
          <View style={styles.newsHeaderLeft}>
            <View style={styles.symbolContainer}>
              <Text style={styles.symbolText}>{item.symbol}</Text>
            </View>
            {item.sentiment && (
              <View style={[styles.sentimentContainer, { backgroundColor: sentimentStyle.backgroundColor }]}>
                <Icon name={sentimentStyle.icon} size={12} color={sentimentStyle.color} />
                <Text style={[styles.sentimentText, { color: sentimentStyle.color }]}>
                  {item.sentiment}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.newsTime}>
            {formatDate(item.published_at)}
          </Text>
        </View>
        
        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
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
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading latest news...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={Colors.negative} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchNews()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!news || news.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="file-text" size={48} color={Colors.secondaryText} />
        <Text style={styles.emptyText}>No news available</Text>
        <Text style={styles.emptySubtext}>
          News will appear here when our automated system finds relevant articles
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => fetchNews()}>
          <Icon name="refresh-cw" size={16} color={Colors.primary} />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Auto-refresh header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Latest Stock News</Text>
          {lastUpdated && (
            <Text style={styles.lastUpdated}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <View style={styles.autoRefreshIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
          <TouchableOpacity onPress={() => fetchNews(true)} style={styles.headerRefreshButton}>
            <Icon name="refresh-cw" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchNews(true)}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  autoRefreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff00',
  },
  liveText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  headerRefreshButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  newsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbolContainer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  symbolText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  sentimentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  sentimentText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  newsTime: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 22,
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
    textTransform: 'capitalize',
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
  refreshButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  refreshButtonText: {
    color: Colors.primary,
    fontWeight: '500',
  },
}); 