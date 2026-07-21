import React from 'react';
import { View } from 'react-native';
import { AdView, AdFormat } from 'react-native-applovin-max';
import { APPLOVIN_BANNER_AD_UNIT_ID } from '@env';
import { usePremiumStatus } from '../hooks/usePremium';
import { useAds } from '../hooks/useAds';

// Nunca carga ni renderiza el SDK de ads para usuarios premium, ni mientras
// el estado de premium o la inicialización del SDK no resolvieron.
export default function AdBanner() {
  const { isPremium, loading } = usePremiumStatus();
  const { sdkReady } = useAds();
  if (loading || isPremium || !sdkReady) return null;

  return (
    <View style={{ alignItems: 'center', marginBottom: 16 }}>
      <AdView
        adUnitId={APPLOVIN_BANNER_AD_UNIT_ID}
        adFormat={AdFormat.BANNER}
        style={{ width: '100%', height: 50 }}
      />
    </View>
  );
}
