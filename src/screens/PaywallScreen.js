import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, PAYWALL_FEATURES } from '../constants';
import { useLang } from '../hooks/useLang';
import { usePremiumStatus } from '../hooks/usePremium';

const FEATURE_LABEL_KEY = {
  exportNoAds: 'featExportNoAds', advancedCharts: 'featAdvancedCharts',
  unlimitedCategories: 'featUnlimitedCategories', noAds: 'featNoAds',
  budgetAlerts: 'featBudgetAlerts', savingsGoals: 'featSavingsGoals',
  multiCurrency: 'featMultiCurrency', billReminders: 'featBillReminders',
  deviceSync: 'featDeviceSync', aiSummary: 'featAiSummary',
  unlimitedTx: 'featUnlimitedTx', bcraRate: 'featBcraRate', basicChart: 'featBasicChart',
};

const Cell = ({ value }) => {
  if (value === true) return <Text style={styles.cellCheck}>✓</Text>;
  if (value === false) return <Text style={styles.cellCross}>—</Text>;
  return <Text style={styles.cellText}>{value}</Text>;
};

export default function PaywallScreen({ visible, onClose, trigger }) {
  const { t } = useLang();
  const { offerings, purchase, restore } = usePremiumStatus();
  const [plan, setPlan] = useState('annual');
  const [busy, setBusy] = useState(false);

  const monthlyPkg = offerings?.current?.monthly ?? null;
  const annualPkg = offerings?.current?.annual ?? null;
  const selectedPkg = plan === 'annual' ? annualPkg : monthlyPkg;

  const handlePurchase = async () => {
    if (!selectedPkg) return;
    setBusy(true);
    const result = await purchase(selectedPkg.identifier);
    setBusy(false);
    if (result.success) {
      onClose?.();
    } else if (result.error !== 'cancelled') {
      Alert.alert(t('error'), t('paywallPurchaseError'));
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    const result = await restore();
    setBusy(false);
    if (result.success) {
      Alert.alert(t('paywallTitle'), result.restored ? t('paywallRestoreSuccess') : t('paywallRestoreEmpty'));
      if (result.restored) onClose?.();
    } else {
      Alert.alert(t('error'), t('paywallPurchaseError'));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.safe}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('paywallTitle')}</Text>
          <Text style={styles.subtitle}>{t('paywallSubtitle')}</Text>

          <View style={styles.planToggle}>
            <TouchableOpacity
              style={[styles.planBtn, plan === 'monthly' && styles.planBtnActive]}
              onPress={() => setPlan('monthly')}>
              <Text style={[styles.planBtnText, plan === 'monthly' && styles.planBtnTextActive]}>
                {t('paywallMonthly')}
              </Text>
              {monthlyPkg && <Text style={styles.planPrice}>{monthlyPkg.product.priceString}</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.planBtn, plan === 'annual' && styles.planBtnActive]}
              onPress={() => setPlan('annual')}>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{t('paywallSavePct')}</Text>
              </View>
              <Text style={[styles.planBtnText, plan === 'annual' && styles.planBtnTextActive]}>
                {t('paywallAnnual')}
              </Text>
              {annualPkg && <Text style={styles.planPrice}>{annualPkg.product.priceString}</Text>}
              <Text style={styles.planTrial}>{t('paywallTrialBadge')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.table}>
            <View style={[styles.row, styles.rowHeader]}>
              <Text style={[styles.headCell, { flex: 2 }]}>{t('paywallFeatureCol')}</Text>
              <Text style={styles.headCell}>{t('paywallFreeCol')}</Text>
              <Text style={[styles.headCell, { color: COLORS.accent }]}>{t('paywallPremiumCol')}</Text>
            </View>
            {PAYWALL_FEATURES.map((f) => (
              <View key={f.key} style={styles.row}>
                <Text style={[styles.featLabel, { flex: 2 }]}>{t(FEATURE_LABEL_KEY[f.key])}</Text>
                <View style={styles.cellWrap}>
                  <Cell value={f.free === 'capped' ? t('capped3') : f.free} />
                </View>
                <View style={styles.cellWrap}>
                  <Cell value={f.premium} />
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.cta} onPress={handlePurchase} disabled={busy || !selectedPkg}>
            {busy
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.ctaText}>{plan === 'annual' ? t('paywallCTA') : t('paywallCTANoTrial')}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={busy}>
            <Text style={styles.restoreText}>{t('paywallRestore')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.laterText}>{t('paywallClose')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync('https://flowcash.app/terms')}>
            <Text style={styles.termsText}>{t('paywallTerms')}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, padding: 24 },
  closeBtn: { alignSelf: 'flex-end', padding: 8, marginTop: 8 },
  closeBtnText: { fontSize: 18, color: COLORS.muted },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 },
  planToggle: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  planBtn: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 18, padding: 16,
    borderWidth: 2, borderColor: COLORS.border, alignItems: 'center',
  },
  planBtnActive: { borderColor: COLORS.accent, backgroundColor: COLORS.card2 },
  planBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.muted },
  planBtnTextActive: { color: COLORS.text },
  planPrice: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginTop: 6 },
  planTrial: { fontSize: 11, color: COLORS.accent, marginTop: 4, fontWeight: '600' },
  planBadge: {
    position: 'absolute', top: -10, backgroundColor: COLORS.accent2,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  planBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  table: {
    backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1,
    borderColor: COLORS.border, overflow: 'hidden', marginBottom: 24,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    paddingHorizontal: 12, borderBottomWidth: 1, borderColor: COLORS.border,
  },
  rowHeader: { backgroundColor: COLORS.card2 },
  headCell: { flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.muted, textAlign: 'center', textTransform: 'uppercase' },
  featLabel: { fontSize: 12, color: COLORS.text },
  cellWrap: { flex: 1, alignItems: 'center' },
  cellCheck: { color: COLORS.accent, fontWeight: '900', fontSize: 15 },
  cellCross: { color: COLORS.muted, fontSize: 14 },
  cellText: { color: COLORS.text, fontSize: 11, fontWeight: '600' },
  cta: { backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#000' },
  restoreBtn: { alignItems: 'center', paddingVertical: 10 },
  restoreText: { fontSize: 13, color: COLORS.accent2, fontWeight: '600' },
  laterText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 8 },
  termsText: { fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: 16, textDecorationLine: 'underline' },
});
