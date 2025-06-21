import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Purchases, { 
  CustomerInfo, 
  PurchasesEntitlementInfo, 
  PurchasesPackage,
  PurchasesOfferings,
  PurchasesOffering 
} from 'react-native-purchases';
import * as SubscriptionService from '@/services/revenueCat';

type SubscriptionContextType = {
  customerInfo: CustomerInfo | null;
  isSubscribed: boolean;
  isTrial: boolean;
  isLoading: boolean;
  offerings: PurchasesOffering | null;
  refreshSubscription: () => Promise<void>;
  purchaseSubscription: (packageToPurchase: PurchasesPackage) => Promise<CustomerInfo | null>;
  restorePurchases: () => Promise<CustomerInfo>;
  loadOfferings: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSubscribed = customerInfo?.entitlements.active['premium']?.isActive === true;
  const entitlement = customerInfo?.entitlements.active['premium'];
  const isTrial = entitlement?.ownershipType === 'PURCHASED' && 
    customerInfo?.entitlements.active['premium']?.willRenew === true && 
    customerInfo?.entitlements.active['premium']?.periodType === 'TRIAL';
    
  const loadOfferings = useCallback(async () => {
    try {
      const offerings = await SubscriptionService.getOfferings();
      if (offerings) {
        setOfferings(offerings.current);
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
    }
  }, []);

  const refreshSubscription = async () => {
    try {
      const info = await SubscriptionService.getCustomerInfo();
      setCustomerInfo(info);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await refreshSubscription();
      await loadOfferings();
    };
    
    init();

    // Listen for purchases made outside the app
    // The return type is void, but in reality it returns an unsubscribe function
    // We'll use the remove() method on the listener object
    const listener = {
      remove: () => {}
    } as { remove: () => void };
    
    // This will actually set up the listener and store the remove function
    listener.remove = Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
      setCustomerInfo(info);
    }) as unknown as () => void;

    // Return cleanup function
    return () => {
      try {
        if (listener && typeof listener.remove === 'function') {
          listener.remove();
        }
      } catch (error) {
        console.error('Error cleaning up subscription:', error);
      }
    };
  }, [loadOfferings]);

  const purchaseSubscription = async (packageToPurchase: PurchasesPackage) => {
    setIsLoading(true);
    try {
      const info = await SubscriptionService.purchaseSubscription(packageToPurchase);
      if (info) {
        setCustomerInfo(info);
      }
      return info;
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    setIsLoading(true);
    try {
      const info = await SubscriptionService.restorePurchases();
      setCustomerInfo(info);
      return info;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        customerInfo,
        isSubscribed,
        isTrial,
        isLoading,
        offerings,
        refreshSubscription,
        purchaseSubscription,
        restorePurchases,
        loadOfferings,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
