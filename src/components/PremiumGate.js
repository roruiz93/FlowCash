import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { useLang } from '../hooks/useLang';
import { usePremiumStatus } from '../hooks/usePremium';

const LEGACY_KEYS = ['budget', 'savings', 'reminders'];

// Hook imperativo para chequeos que no son JSX-wrappable (ej: tope de recordatorios antes de un modal).
export const useFeatureAccess = (feature, respectLegacy = true) => {
  const { isPremium, legacyFreeAccess } = usePremiumStatus();
  if (isPremium) return true;
  if (respectLegacy && LEGACY_KEYS.includes(feature) && legacyFreeAccess?.[feature]) return true;
  return false;
};

export default function PremiumGate({ feature, respectLegacy = true, mode = 'lockedCard', fallback = null, children }) {
  const { t } = useLang();
  const { openPaywall, loading } = usePremiumStatus();
  const hasAccess = useFeatureAccess(feature, respectLegacy);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  if (hasAccess) return children;
  if (mode === 'hide') return null;
  if (mode === 'fallback') return fallback;

  return (
    <View style={styles.center}>
      <View style={styles.card}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.title}>{t('paywallTitle')}</Text>
        <Text style={styles.subtitle}>{t('paywallSubtitle')}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => openPaywall(feature)}>
          <Text style={styles.btnText}>{t('paywallCTA')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 24, padding: 28,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
    width: '100%', maxWidth: 340,
  },
  lockIcon: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  btn: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#000' },
});
