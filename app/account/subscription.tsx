import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { 
    isSubscribed, 
    isTrial, 
    isLoading, 
    purchaseSubscription, 
    restorePurchases,
    offerings
  } = useSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Get the monthly package from offerings
  const monthlyPackage = offerings?.availablePackages.find(
    pkg => pkg.packageType === 'MONTHLY' && pkg.identifier.includes('monthly')
  );
  
  const monthlyPrice = monthlyPackage?.product.priceString || '$0.99';

  const handleSubscribe = async (pkg: PurchasesPackage) => {
    try {
      setIsProcessing(true);
      setSelectedPlan(pkg.packageType);
      await purchaseSubscription(pkg);
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleRestore = async () => {
    try {
      setIsProcessing(true);
      await restorePurchases();
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Premium Membership</Text>
        <Text style={styles.subtitle}>
          {isSubscribed 
            ? isTrial 
              ? `You're on a free trial (${monthlyPrice} after trial)` 
              : 'Your subscription is active'
            : 'Upgrade to unlock all features'}
        </Text>
      </View>

      {!isSubscribed && (
        <View style={styles.plansContainer}>
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Monthly Plan</Text>
              <Text style={styles.planPrice}>
                {monthlyPrice}
                <Text style={styles.planPeriod}>/month</Text>
              </Text>
              {monthlyPackage?.product.introPrice && (
                <Text style={styles.planTrial}>
                  {'paymentMode' in monthlyPackage.product.introPrice && 
                  monthlyPackage.product.introPrice.paymentMode === 'FREE_TRIAL' 
                    ? '7-day free trial'
                    : 'Special offer'}
                </Text>
              )}
            </View>
            
            <View style={styles.features}>
              <FeatureItem text="All premium features" />
              <FeatureItem text="Cancel anytime" />
              <FeatureItem text="7-day free trial" />
            </View>

            <TouchableOpacity 
              style={[styles.subscribeButton, isProcessing && styles.disabledButton]}
              onPress={() => monthlyPackage && handleSubscribe(monthlyPackage)}
              disabled={isProcessing || !monthlyPackage}
            >
              {isProcessing && selectedPlan === 'monthly' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {monthlyPackage?.product.introPrice
                    ? 'Start Free Trial' 
                    : `Subscribe for ${monthlyPrice}/month`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isSubscribed && (
        <View style={styles.currentPlanContainer}>
          <View style={styles.currentPlanCard}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
            <Text style={styles.currentPlanText}>
              {isTrial ? 'Free Trial Active' : 'Premium Active'}
            </Text>
          </View>
          <Text style={styles.planDetails}>
            {isTrial 
              ? 'Your free trial will automatically convert to a paid subscription after 7 days.'
              : 'Your subscription will automatically renew each month.'}
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={isProcessing}
      >
        <Text style={styles.restoreButtonText}>
          {isProcessing ? 'Processing...' : 'Restore Purchases'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        Payment will be charged to your Apple ID account at the confirmation of purchase. 
        Subscription automatically renews unless it is canceled at least 24 hours before 
        the end of the current period. Your account will be charged for renewal within 
        24 hours prior to the end of the current period.
      </Text>
    </ScrollView>
  );
}

const FeatureItem = ({ text }: { text: string }) => (
  <View style={styles.featureItem}>
    <Ionicons name="checkmark" size={20} color={Colors.primary} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  plansContainer: {
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 16,
    color: Colors.secondaryText,
    fontWeight: 'normal',
  },
  planTrial: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  features: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text,
  },
  subscribeButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  currentPlanContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  currentPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  currentPlanText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 12,
  },
  planDetails: {
    textAlign: 'center',
    color: Colors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  restoreButton: {
    padding: 16,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
