import React, { createContext, useContext, useRef, useCallback, useEffect, useState } from 'react';
import AppLovinMAX from 'react-native-applovin-max';
import { APPLOVIN_SDK_KEY } from '@env';
import { usePremiumStatus } from './usePremium';

const INTERSTITIAL_COOLDOWN_MS = 2.5 * 60 * 1000; // ~2-3 min entre intersticiales ocasionales

const AdsContext = createContext({
  sdkReady: false,
  canShowOccasional: () => true,
  markInterstitialShown: () => {},
});

// Inicializa el SDK de AppLovin MAX una sola vez, y solo para usuarios no premium
// (los usuarios premium nunca tocan el SDK de ads, ni siquiera para inicializarlo).
// También coordina el cooldown global entre intersticiales "ocasionales".
export const AdsProvider = ({ children }) => {
  const { isPremium, loading } = usePremiumStatus();
  const [sdkReady, setSdkReady] = useState(false);
  const initStarted = useRef(false);
  const lastInterstitialAt = useRef(0);

  useEffect(() => {
    if (loading || isPremium || initStarted.current) return;
    initStarted.current = true;
    AppLovinMAX.initialize(APPLOVIN_SDK_KEY)
      .then(() => setSdkReady(true))
      .catch(() => setSdkReady(false));
  }, [loading, isPremium]);

  const canShowOccasional = useCallback(() => {
    return Date.now() - lastInterstitialAt.current >= INTERSTITIAL_COOLDOWN_MS;
  }, []);

  const markInterstitialShown = useCallback(() => {
    lastInterstitialAt.current = Date.now();
  }, []);

  return (
    <AdsContext.Provider value={{ sdkReady, canShowOccasional, markInterstitialShown }}>
      {children}
    </AdsContext.Provider>
  );
};

export const useAds = () => useContext(AdsContext);
