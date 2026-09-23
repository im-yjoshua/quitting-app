import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProContextValue {
  isPro: boolean;
  setProStatus: (status: boolean) => Promise<void>;
  isPaywallVisible: boolean;
  showPaywall: () => void;
  hidePaywall: () => void;
}

const ProContext = createContext<ProContextValue | null>(null);

const PRO_STORAGE_KEY = '@sovereign/is_pro';

export const ProProvider = ({ children }: { children: ReactNode }) => {
  const [isPro, setIsPro] = useState<boolean>(false);
  const [isPaywallVisible, setIsPaywallVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadProStatus = async () => {
      try {
        const stored = await AsyncStorage.getItem(PRO_STORAGE_KEY);
        if (stored !== null) {
          setIsPro(stored === 'true');
        }
      } catch (e) {
        console.warn('[ProContext] Failed to load pro status:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadProStatus();
  }, []);

  const setProStatus = useCallback(async (status: boolean) => {
    setIsPro(status);
    try {
      await AsyncStorage.setItem(PRO_STORAGE_KEY, status ? 'true' : 'false');
    } catch (e) {
      console.warn('[ProContext] Failed to save pro status:', e);
    }
  }, []);

  const showPaywall = useCallback(() => {
    setIsPaywallVisible(true);
  }, []);

  const hidePaywall = useCallback(() => {
    setIsPaywallVisible(false);
  }, []);

  const value = useMemo(
    () => ({
      isPro,
      setProStatus,
      isPaywallVisible,
      showPaywall,
      hidePaywall,
    }),
    [isPro, setProStatus, isPaywallVisible, showPaywall, hidePaywall]
  );

  if (isLoading) {
    return null; // or loading screen
  }

  return (
    <ProContext.Provider value={value}>
      {children}
    </ProContext.Provider>
  );
};

export const usePro = (): ProContextValue => {
  const context = useContext(ProContext);
  if (!context) {
    throw new Error('usePro must be used within a ProProvider');
  }
  return context;
};
