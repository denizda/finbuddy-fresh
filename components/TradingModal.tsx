import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth-store';

interface TradingModalProps {
  visible: boolean;
  onClose: () => void;
  onTradeComplete: () => void;
  existingStock?: {
    symbol: string;
    name: string;
    quantity: number;
    averageCost: number;
  };
}

export default function TradingModal({ visible, onClose, onTradeComplete, existingStock }: TradingModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [quantity, setQuantity] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const { user } = useAuthStore();
  const utils = trpc.useContext();

  // Search stocks
  const { data: searchResults, isLoading: isSearching } = trpc.useQuery([
    'stocks.searchStocks',
    { query: searchQuery }
  ], {
    enabled: searchQuery.length > 0 && !existingStock,
  });

  // Get account balance
  const { data: accountData } = trpc.useQuery([
    'trading.getAccountBalance',
    { userId: user?.id || '' }
  ], {
    enabled: !!user?.id,
  });

  // Get stock quote for selected stock
  const { data: stockQuote } = trpc.useQuery([
    'stocks.getStockQuote',
    { symbol: selectedStock?.symbol || existingStock?.symbol || '' }
  ], {
    enabled: !!(selectedStock?.symbol || existingStock?.symbol),
  });

  // Execute trade mutation
  const tradeMutation = trpc.useMutation(['trading.executeTrade'], {
    onSuccess: () => {
      Alert.alert('Success', `Trade executed successfully!`);
      utils.invalidateQueries(['portfolio.getPortfolio']);
      utils.invalidateQueries(['trading.getAccountBalance']);
      onTradeComplete();
      handleClose();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  useEffect(() => {
    if (existingStock) {
      setSelectedStock(existingStock);
    }
  }, [existingStock]);

  const handleClose = () => {
    setSearchQuery('');
    setSelectedStock(null);
    setQuantity('');
    setTradeType('buy');
    onClose();
  };

  const handleTrade = () => {
    if (!user?.id) return;
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    const stock = selectedStock || existingStock;
    if (!stock) return;

    const price = stockQuote?.price || 0;
    const totalValue = qty * price;

    if (tradeType === 'buy' && totalValue > (accountData?.availableBalance || 0)) {
      Alert.alert('Error', 'Insufficient funds');
      return;
    }

    if (tradeType === 'sell' && existingStock && qty > existingStock.quantity) {
      Alert.alert('Error', `You only have ${existingStock.quantity} shares`);
      return;
    }

    tradeMutation.mutate({
      userId: user.id,
      symbol: stock.symbol,
      companyName: stock.name || stock.description,
      quantity: qty,
      price,
      type: tradeType,
    });
  };

  const currentPrice = stockQuote?.price || 0;
  const totalValue = currentPrice * (parseInt(quantity) || 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {existingStock ? 'Trade Stock' : 'Add Stock'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name="x" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {!existingStock && (
            <>
              <View style={styles.searchContainer}>
                <Icon name="search" size={20} color={Colors.secondaryText} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={Colors.secondaryText}
                />
              </View>

              {isSearching && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              )}

              {searchResults && searchResults.length > 0 && (
                <ScrollView style={styles.searchResults}>
                  {searchResults.map((stock: any) => (
                    <TouchableOpacity
                      key={stock.symbol}
                      style={styles.stockItem}
                      onPress={() => {
                        setSelectedStock(stock);
                        setSearchQuery('');
                      }}
                    >
                      <View>
                        <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                        <Text style={styles.stockName}>{stock.description}</Text>
                      </View>
                      <View style={styles.stockPrice}>
                        <Text style={styles.priceText}>${stock.price.toFixed(2)}</Text>
                        <Text style={[
                          styles.changeText,
                          { color: stock.change >= 0 ? Colors.secondary : Colors.negative }
                        ]}>
                          {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          )}

          {(selectedStock || existingStock) && (
            <View style={styles.tradeSection}>
              <View style={styles.selectedStockInfo}>
                <Text style={styles.selectedSymbol}>
                  {selectedStock?.symbol || existingStock?.symbol}
                </Text>
                <Text style={styles.selectedName}>
                  {selectedStock?.description || existingStock?.name}
                </Text>
                <Text style={styles.currentPrice}>
                  Current Price: ${currentPrice.toFixed(2)}
                </Text>
              </View>

              {existingStock && (
                <View style={styles.positionInfo}>
                  <Text style={styles.positionText}>
                    Current Position: {existingStock.quantity} shares @ ${existingStock.averageCost.toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.tradeTypeContainer}>
                <TouchableOpacity
                  style={[styles.tradeTypeButton, tradeType === 'buy' && styles.buyButton]}
                  onPress={() => setTradeType('buy')}
                >
                  <Text style={[styles.tradeTypeText, tradeType === 'buy' && styles.activeTradeText]}>
                    Buy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tradeTypeButton, tradeType === 'sell' && styles.sellButton]}
                  onPress={() => setTradeType('sell')}
                  disabled={!existingStock}
                >
                  <Text style={[styles.tradeTypeText, tradeType === 'sell' && styles.activeTradeText]}>
                    Sell
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.quantityContainer}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.secondaryText}
                />
              </View>

              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Value</Text>
                  <Text style={styles.summaryValue}>${totalValue.toFixed(2)}</Text>
                </View>
                {tradeType === 'buy' && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Available Balance</Text>
                    <Text style={styles.summaryValue}>
                      ${(accountData?.availableBalance || 0).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.tradeButton,
                  tradeType === 'buy' ? styles.buyTradeButton : styles.sellTradeButton,
                  (!quantity || tradeMutation.isLoading) && styles.disabledButton,
                ]}
                onPress={handleTrade}
                disabled={!quantity || tradeMutation.isLoading}
              >
                {tradeMutation.isLoading ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <Text style={styles.tradeButtonText}>
                    {tradeType === 'buy' ? 'Buy' : 'Sell'} {quantity || '0'} Shares
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    paddingTop: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold as any,
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingLeft: Theme.spacing.sm,
    fontSize: Theme.typography.sizes.md,
    color: Colors.text,
  },
  loadingContainer: {
    padding: Theme.spacing.lg,
    alignItems: 'center',
  },
  searchResults: {
    maxHeight: 200,
    marginBottom: Theme.spacing.md,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stockSymbol: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.text,
  },
  stockName: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  stockPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium as any,
    color: Colors.text,
  },
  changeText: {
    fontSize: Theme.typography.sizes.sm,
    marginTop: 2,
  },
  tradeSection: {
    marginTop: Theme.spacing.md,
  },
  selectedStockInfo: {
    backgroundColor: Colors.card,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  selectedSymbol: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold as any,
    color: Colors.text,
  },
  selectedName: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  currentPrice: {
    fontSize: Theme.typography.sizes.md,
    color: Colors.primary,
    marginTop: Theme.spacing.xs,
  },
  positionInfo: {
    backgroundColor: Colors.card,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    marginBottom: Theme.spacing.md,
  },
  positionText: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
  },
  tradeTypeContainer: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  tradeTypeButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.card,
  },
  buyButton: {
    backgroundColor: Colors.secondary,
  },
  sellButton: {
    backgroundColor: Colors.negative,
  },
  tradeTypeText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium as any,
    color: Colors.secondaryText,
  },
  activeTradeText: {
    color: Colors.background,
  },
  quantityContainer: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
    marginBottom: Theme.spacing.xs,
  },
  quantityInput: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: Theme.typography.sizes.lg,
    color: Colors.text,
  },
  summaryContainer: {
    backgroundColor: Colors.card,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  summaryLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
  },
  summaryValue: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.text,
  },
  tradeButton: {
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
  buyTradeButton: {
    backgroundColor: Colors.secondary,
  },
  sellTradeButton: {
    backgroundColor: Colors.negative,
  },
  disabledButton: {
    opacity: 0.5,
  },
  tradeButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.background,
  },
}); 