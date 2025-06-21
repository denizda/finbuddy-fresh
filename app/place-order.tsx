import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StatusBar } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
// import { getCompanyById } from '@/mocks/companies';

export default function PlaceOrderScreen() {
  const { id, action } = useLocalSearchParams<{ id: string, action: 'buy' | 'sell' }>();
  const router = useRouter();
  // const company = getCompanyById(id || '1');
  const company = null; // Placeholder since mock is removed
  
  const [quantity, setQuantity] = useState('1');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState(company ? company.price.toFixed(2) : '0.00');
  const [accountBalance] = useState(10000.50); // Mock balance
  
  if (!company) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Company not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const isBuy = action === 'buy';
  const totalCost = orderType === 'market' ? parseFloat(quantity) * company.price : parseFloat(quantity) * parseFloat(limitPrice);
  const canAfford = isBuy ? totalCost <= accountBalance : true;
  
  const handlePlaceOrder = () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
      return;
    }
    
    if (isBuy && !canAfford) {
      Alert.alert('Insufficient Funds', 'You do not have enough balance to place this order.');
      return;
    }
    
    // Simulate order placement
    Alert.alert(
      'Order Placed',
      `${isBuy ? 'Buy' : 'Sell'} order for ${quantity} shares of ${company.symbol} has been placed successfully at $${orderType === 'market' ? company.price.toFixed(2) : limitPrice} per share.`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: `${isBuy ? 'Buy' : 'Sell'} ${company.symbol}`,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <Icon name="arrow-left" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companySymbol}>{company.symbol}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>${company.price.toFixed(2)}</Text>
              <Text style={[styles.priceChange, { color: company.change >= 0 ? Colors.secondary : Colors.negative }]}>
                {company.change >= 0 ? '+' : ''}{company.change.toFixed(2)} ({company.changePercentage.toFixed(2)}%)
              </Text>
            </View>
          </View>
          
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Account Balance</Text>
            <Text style={styles.balanceValue}>${accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            {isBuy && (
              <Text style={[styles.balanceNote, { color: canAfford ? Colors.secondaryText : Colors.negative }]}>
                {canAfford ? `You can buy up to $${Math.floor(accountBalance / company.price).toLocaleString()} worth of ${company.symbol}` : 'Insufficient funds for this order'}
              </Text>
            )}
          </View>
          
          <View style={styles.orderForm}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            
            <View style={styles.orderTypeContainer}>
              <TouchableOpacity
                style={[styles.orderTypeButton, isBuy && styles.buyButtonActive]}
                onPress={() => router.replace(`/place-order?id=${id}&action=buy`)}
              >
                <Text style={[styles.orderTypeText, isBuy && styles.buyTextActive]}>Buy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.orderTypeButton, !isBuy && styles.sellButtonActive]}
                onPress={() => router.replace(`/place-order?id=${id}&action=sell`)}
              >
                <Text style={[styles.orderTypeText, !isBuy && styles.sellTextActive]}>Sell</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="Enter quantity"
              placeholderTextColor={Colors.secondaryText}
            />
            
            <Text style={styles.inputLabel}>Order Type</Text>
            <View style={styles.orderTypeSelector}>
              <TouchableOpacity
                style={[styles.typeSelectorButton, orderType === 'market' && styles.selectedTypeButton]}
                onPress={() => setOrderType('market')}
              >
                <Text style={[styles.typeSelectorText, orderType === 'market' && styles.selectedTypeText]}>Market</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeSelectorButton, orderType === 'limit' && styles.selectedTypeButton]}
                onPress={() => setOrderType('limit')}
              >
                <Text style={[styles.typeSelectorText, orderType === 'limit' && styles.selectedTypeText]}>Limit</Text>
              </TouchableOpacity>
            </View>
            
            {orderType === 'limit' && (
              <>
                <Text style={styles.inputLabel}>Limit Price</Text>
                <TextInput
                  style={styles.input}
                  value={limitPrice}
                  onChangeText={setLimitPrice}
                  keyboardType="decimal-pad"
                  placeholder="Enter limit price"
                  placeholderTextColor={Colors.secondaryText}
                />
              </>
            )}
            
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Estimated {isBuy ? 'Cost' : 'Credit'}</Text>
              <Text style={[styles.totalValue, !canAfford && isBuy && { color: Colors.negative }]}>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.placeOrderButton, !canAfford && isBuy && styles.disabledButton]}
              onPress={handlePlaceOrder}
              disabled={!canAfford && isBuy}
            >
              <Icon name="shopping-cart" size={18} color={Colors.background} />
              <Text style={styles.placeOrderButtonText}>Place {isBuy ? 'Buy' : 'Sell'} Order</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBackButton: {
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  errorText: {
    fontSize: Theme.typography.sizes.lg,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  backButton: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
  },
  backButtonText: {
    color: Colors.background,
    fontWeight: Theme.typography.weights.medium as any,
  },
  companyInfo: {
    padding: Theme.spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    margin: Theme.spacing.md,
    ...Theme.shadows.small,
  },
  companyName: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Theme.spacing.xs,
  },
  companySymbol: {
    fontSize: Theme.typography.sizes.md,
    color: Colors.secondaryText,
    marginBottom: Theme.spacing.md,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold as any,
    color: Colors.text,
    marginRight: Theme.spacing.md,
  },
  priceChange: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium as any,
  },
  balanceContainer: {
    padding: Theme.spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    margin: Theme.spacing.md,
    ...Theme.shadows.small,
  },
  balanceLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
    marginBottom: Theme.spacing.xs,
  },
  balanceValue: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: Theme.typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Theme.spacing.sm,
  },
  balanceNote: {
    fontSize: Theme.typography.sizes.sm,
    marginTop: Theme.spacing.sm,
  },
  orderForm: {
    padding: Theme.spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    margin: Theme.spacing.md,
    ...Theme.shadows.small,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.md,
    overflow: 'hidden',
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
  },
  orderTypeText: {
    fontSize: Theme.typography.sizes.md,
    color: Colors.secondaryText,
  },
  buyButtonActive: {
    backgroundColor: Colors.secondary,
  },
  buyTextActive: {
    color: Colors.background,
    fontWeight: Theme.typography.weights.semibold as any,
  },
  sellButtonActive: {
    backgroundColor: Colors.negative,
  },
  sellTextActive: {
    color: Colors.background,
    fontWeight: Theme.typography.weights.semibold as any,
  },
  inputLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: Theme.typography.sizes.md,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderTypeSelector: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeSelectorButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
  },
  typeSelectorText: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
  },
  selectedTypeButton: {
    backgroundColor: Colors.primary,
  },
  selectedTypeText: {
    color: Colors.background,
    fontWeight: Theme.typography.weights.medium as any,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    padding: Theme.spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalLabel: {
    fontSize: Theme.typography.sizes.md,
    color: Colors.text,
  },
  totalValue: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold as any,
    color: Colors.text,
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.md,
  },
  disabledButton: {
    backgroundColor: Colors.border,
  },
  placeOrderButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.background,
    marginLeft: Theme.spacing.sm,
  },
});