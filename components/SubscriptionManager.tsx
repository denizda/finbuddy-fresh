import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import Colors from '@/constants/colors';
import Icon from 'react-native-vector-icons/Feather';

// Initialize RevenueCat with your API key
const REVENUECAT_API_KEY = Platform.select({
  ios: 'YOUR_IOS_KEY', // Replace with your actual RevenueCat API key
  android: 'YOUR_ANDROID_KEY',
  default: '',
});

Purchases.configure({ apiKey: REVENUECAT_API_KEY });

export default function SubscriptionManager() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  const loadSubscriptionInfo = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current?.availablePackages) {
        setPackages(offerings.current.availablePackages);
      }
      
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (error) {
      console.error('Error loading subscription info:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pack: PurchasesPackage) => {
    try {
      setLoading(true);
      const { customerInfo } = await Purchases.purchasePackage(pack);
      setCustomerInfo(customerInfo);
      
      if (customerInfo.entitlements.active['premium']) {
        Alert.alert('Success', 'Thank you for subscribing!');
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      setLoading(true);
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      
      if (info.entitlements.active['premium']) {
        Alert.alert('Success', 'Your subscription has been restored!');
      } else {
        Alert.alert('No Subscription Found', 'No active subscription was found.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isSubscribed = customerInfo?.entitlements.active['premium'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Premium Subscription</Text>
        <Text style={styles.subtitle}>
          {isSubscribed ? 'Active Subscription' : 'Upgrade to Premium'}
        </Text>
      </View>

      {isSubscribed ? (
        <View style={styles.activeSubscription}>
          <Icon name="check-circle" size={48} color={Colors.primary} />
          <Text style={styles.activeText}>You're a Premium Member!</Text>
          <Text style={styles.benefitsText}>
            Enjoy all premium features and benefits
          </Text>
        </View>
      ) : (
        <View style={styles.subscriptionOptions}>
          {packages.map((pack) => (
            <TouchableOpacity
              key={pack.identifier}
              style={styles.packageCard}
              onPress={() => handlePurchase(pack)}
            >
              <View style={styles.packageHeader}>
                <Text style={styles.packageTitle}>
                  {pack.product.title}
                </Text>
                <Text style={styles.packagePrice}>
                  {pack.product.priceString}
                </Text>
              </View>
              <Text style={styles.packageDescription}>
                {pack.product.description}
              </Text>
              {false && (
                <Text style={styles.trialText}>
                  Includes 7-day free trial
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.restoreButton}
        onPress={restorePurchases}
      >
        <Text style={styles.restoreButtonText}>Restore Purchases</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.secondaryText,
  },
  activeSubscription: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  activeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  benefitsText: {
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  subscriptionOptions: {
    gap: 16,
  },
  packageCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  packageDescription: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 8,
  },
  trialText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  restoreButton: {
    marginTop: 24,
    padding: 16,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
}); 