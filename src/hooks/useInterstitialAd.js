import { useEffect, useState, useCallback } from 'react';
import { InterstitialAd } from 'react-native-applovin-max';
import { APPLOVIN_INTERSTITIAL_AD_UNIT_ID } from '@env';
import { useAds } from './useAds';

// mandatory=true (ej: antes de exportar) ignora el cooldown compartido pero sigue respetando `enabled`.
// mandatory=false (intersticial ocasional) además respeta el cooldown global de useAds().
export const useInterstitialAd = ({ enabled = true, mandatory = false } = {}) => {
  const { sdkReady, canShowOccasional, markInterstitialShown } = useAds();
  const [isLoaded, setIsLoaded] = useState(false);
  const active = enabled && sdkReady;

  useEffect(() => {
    if (!active) {
      setIsLoaded(false);
      return;
    }

    const onLoaded = () => setIsLoaded(true);
    const onLoadFailed = () => setIsLoaded(false);
    const onHidden = () => {
      setIsLoaded(false);
      InterstitialAd.loadAd(APPLOVIN_INTERSTITIAL_AD_UNIT_ID); // precarga el próximo
    };

    InterstitialAd.addAdLoadedEventListener(onLoaded);
    InterstitialAd.addAdLoadFailedEventListener(onLoadFailed);
    InterstitialAd.addAdHiddenEventListener(onHidden);
    InterstitialAd.loadAd(APPLOVIN_INTERSTITIAL_AD_UNIT_ID);

    return () => {
      InterstitialAd.removeAdLoadedEventListener();
      InterstitialAd.removeAdLoadFailedEventListener();
      InterstitialAd.removeAdHiddenEventListener();
    };
  }, [active]);

  const showAd = useCallback(async () => {
    if (!active) return false;
    if (!mandatory && !canShowOccasional()) return false;
    const ready = await InterstitialAd.isAdReady(APPLOVIN_INTERSTITIAL_AD_UNIT_ID);
    if (!ready) return false;
    InterstitialAd.showAd(APPLOVIN_INTERSTITIAL_AD_UNIT_ID);
    if (!mandatory) markInterstitialShown();
    return true;
  }, [active, mandatory, canShowOccasional, markInterstitialShown]);

  return { showAd, isLoaded };
};
