import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Dimensions } from 'react-native';

interface OrientationContextType {
  isLandscape: boolean;
  isChartsScreenLandscape: boolean;
  setChartsScreenLandscape: (isLandscape: boolean) => void;
}

const OrientationContext = createContext<OrientationContextType | undefined>(undefined);

export function OrientationProvider({ children }: { children: ReactNode }) {
  const [isLandscape, setIsLandscape] = useState(false);
  const [isChartsScreenLandscape, setChartsScreenLandscape] = useState(false);

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      const landscape = width > height;
      setIsLandscape(landscape);
    };

    // Initial check
    updateOrientation();

    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', updateOrientation);

    return () => subscription?.remove();
  }, []);

  return (
    <OrientationContext.Provider
      value={{
        isLandscape,
        isChartsScreenLandscape,
        setChartsScreenLandscape,
      }}
    >
      {children}
    </OrientationContext.Provider>
  );
}

export function useOrientation() {
  const context = useContext(OrientationContext);
  if (context === undefined) {
    throw new Error('useOrientation must be used within an OrientationProvider');
  }
  return context;
} 