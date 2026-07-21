import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import Purchases from 'react-native-purchases';
import { REVENUECAT_IOS_API_KEY, REVENUECAT_ANDROID_API_KEY } from '@env';
import { Platform } from 'react-native';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';
import { computeAndSaveLegacyFreeAccess } from '../utils/legacyAccess';

const ENTITLEMENT_ID = 'premium';

const PremiumContext = createContext({
  isPremium: false,
  loading: true,
  premiumExpiresAt: null,
  legacyFreeAccess: { budget: false, savings: false, reminders: false },
  offerings: null,
  purchase: async () => ({ success: false, error: 'not-ready' }),
  restore: async () => ({ success: false, error: 'not-ready' }),
  openPaywall: () => {},
  closePaywall: () => {},
  paywallVisible: false,
  paywallTrigger: null,
});

export const PremiumProvider = ({ children }) => {
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [rcReady, setRcReady] = useState(false);
  const [fsReady, setFsReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState(null);
  const [legacyFreeAccess, setLegacyFreeAccess] = useState({ budget: false, savings: false, reminders: false });
  const [offerings, setOfferings] = useState(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState(null);

  const legacyComputing = useRef(false);
  const configuredUid = useRef(null);

  const syncFromCustomerInfo = useCallback(async (customerInfo) => {
    const entitlement = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
    const nowPremium = !!entitlement;
    setIsPremium(nowPremium);
    setPremiumExpiresAt(entitlement?.expirationDate ?? null);
    setRcReady(true);
    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid), {
          isPremium: nowPremium,
          premiumSource: nowPremium ? 'revenuecat' : 'none',
          premiumProductId: entitlement?.productIdentifier ?? null,
          premiumExpiresAt: entitlement?.expirationDate ?? null,
          revenueCatAppUserId: uid,
          revenueCatSyncedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (e) {
        // Firestore write failure aquí no debe bloquear el estado local de premium
      }
    }
  }, [uid]);

  // Configura RevenueCat con el uid actual (appUserID) y engancha el listener de entitlements.
  useEffect(() => {
    if (!uid) {
      if (configuredUid.current) {
        Purchases.logOut().catch(() => {});
        configuredUid.current = null;
      }
      setRcReady(true);
      return;
    }
    if (configuredUid.current === uid) return;

    const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
    Purchases.configure({ apiKey, appUserID: uid });
    configuredUid.current = uid;

    const listener = (customerInfo) => { syncFromCustomerInfo(customerInfo); };
    Purchases.addCustomerInfoUpdateListener(listener);

    Purchases.getCustomerInfo().then(syncFromCustomerInfo).catch(() => setRcReady(true));
    Purchases.getOfferings().then(setOfferings).catch(() => {});

    return () => Purchases.removeCustomerInfoUpdateListener(listener);
  }, [uid, syncFromCustomerInfo]);

  // Escucha users/{uid}: sincroniza estado premium/legacy entre dispositivos y dispara
  // el cálculo de legacyFreeAccess una única vez por usuario (nunca se re-escanean las colecciones viejas).
  useEffect(() => {
    if (!uid) {
      setFsReady(true);
      setLegacyFreeAccess({ budget: false, savings: false, reminders: false });
      return;
    }
    setFsReady(false);
    const unsub = onSnapshot(doc(db, 'users', uid), async (snap) => {
      const data = snap.data();
      if (data?.legacyFreeAccess) setLegacyFreeAccess(data.legacyFreeAccess);
      if (typeof data?.isPremium === 'boolean' && data.premiumSource !== 'revenuecat') {
        setIsPremium(data.isPremium);
        setPremiumExpiresAt(data.premiumExpiresAt ?? null);
      }
      if (!data?.legacyComputedAt && !legacyComputing.current) {
        legacyComputing.current = true;
        try {
          const legacy = await computeAndSaveLegacyFreeAccess(uid);
          setLegacyFreeAccess(legacy);
        } finally {
          legacyComputing.current = false;
        }
      }
      setFsReady(true);
    }, () => setFsReady(true));
    return unsub;
  }, [uid]);

  const purchase = useCallback(async (packageIdentifier) => {
    try {
      const current = offerings?.current;
      const pkg = current?.availablePackages?.find(p => p.identifier === packageIdentifier)
        || current?.availablePackages?.[0];
      if (!pkg) return { success: false, error: 'no-package' };
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      await syncFromCustomerInfo(customerInfo);
      return { success: true };
    } catch (e) {
      if (e?.userCancelled) return { success: false, error: 'cancelled' };
      return { success: false, error: e?.message || 'purchase-error' };
    }
  }, [offerings, syncFromCustomerInfo]);

  const restore = useCallback(async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      await syncFromCustomerInfo(customerInfo);
      const hasEntitlement = !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
      return { success: true, restored: hasEntitlement };
    } catch (e) {
      return { success: false, error: e?.message || 'restore-error' };
    }
  }, [syncFromCustomerInfo]);

  const openPaywall = useCallback((trigger = null) => {
    setPaywallTrigger(trigger);
    setPaywallVisible(true);
  }, []);
  const closePaywall = useCallback(() => setPaywallVisible(false), []);

  const value = {
    isPremium,
    loading: !rcReady || !fsReady,
    premiumExpiresAt,
    legacyFreeAccess,
    offerings,
    purchase,
    restore,
    openPaywall,
    closePaywall,
    paywallVisible,
    paywallTrigger,
  };

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
};

export const usePremiumStatus = () => useContext(PremiumContext);
