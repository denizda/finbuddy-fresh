import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesPackage, PurchasesOffering } from 'react-native-purchases';

const API_KEYS = {
  apple: 'appl_yourapikeyhere', // Replace with your RevenueCat Apple API key
};

export const initializeRevenueCat = async () => {
  try {
    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    
    // Initialize Purchases
    await Purchases.configure({
      apiKey: API_KEYS.apple,
      appUserID: null, // Anonymously generated user ID is used by default
    });
    
    console.log('RevenueCat initialized');
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('Error getting customer info:', error);
    return null;
  }
};

export const purchaseSubscription = async (packageToPurchase: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo;
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('Error purchasing subscription:', error);
      throw error;
    }
    return null;
  }
};

export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('Error getting offerings:', error);
    return null;
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error;
  }
};
