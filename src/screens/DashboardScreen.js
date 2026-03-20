import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, CAT_EMOJIS, CAT_COLORS } from '../constants';
import { useLang } from '../hooks/useLang';

const fmt = (n) => '$' + Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });

export default function DashboardScreen({ transactions }) {
  const { t } = useLang();
  const now = new Date();

  const monthTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const balance = transactions.reduce((s, tx) => tx.type === 'income' ? s + tx.amount : s - tx.amount, 0);
  const inc = monthTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const exp = monthTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const recent = monthTx.slice(0, 5);
  const months = t('months');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t('balance')}</Text>
        <Text style={[styles.balanceAmount, { color: balance >= 0 ? COLORS.accent : COLORS.red }]}>
          {balance < 0 ? '-' : ''}{fmt(balance)}
        </Text>
        <Text style={styles.balanceMonth}>{months[now.getMonth()]} {now.getFullYear()}</Text>
        <View style={styles.balRow}>
          <View style={styles.balItem}>
            <Text style={styles.balItemLabel}>{t('totalIncome')}</Text>
            <Text style={[styles.balItemVal, { color: COLORS.accent }]}>{fmt(inc)}</Text>
          </View>
          <View style={styles.balItem}>
            <Text style={styles.balItemLabel}>{t('totalExpense')}</Text>
            <Text style={[styles.balItemVal, { color: COLORS.red }]}>{fmt(exp)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('recentTx')}</Text>
      {recent.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💸</Text>
          <Text style={styles.emptyText}>{t('noTx')}</Text>
        </View>
      ) : (
        recent.map(tx => {
          const d = new Date(tx.date);
          return (
            <View key={tx.id} style={styles.txItem}>
              <View style={[styles.txIcon, { backgroundColor: (CAT_COLORS[tx.category] || '#7c5cff') + '22' }]}>
                <Text style={{ fontSize: 20 }}>{CAT_EMOJIS[tx.category] || '📦'}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txName}>{tx.desc}</Text>
                <Text style={styles.txCat}>{t('cats')[tx.category]}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.txAmount, { color: tx.type === 'income' ? COLORS.accent : COLORS.red }]}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </Text>
                <Text style={styles.txDate}>{d.getDate()}/{d.getMonth()+1}/{d.getFullYear()}</Text>
              </View>
            </View>
          );
        })
      )}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  balanceCard: {
    backgroundColor: '#16213e', borderRadius: 24, padding: 24,
    marginBottom: 24, borderWidth: 1, borderColor: 'rgba(124,92,255,0.3)',
  },
  balanceLabel: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  balanceAmount: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  balanceMonth: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  balRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  balItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 12 },
  balItemLabel: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  balItemVal: { fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  txItem: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 10,
  },
  txIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  txCat: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  txDate: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.muted, textAlign: 'center', lineHeight: 22 },
});
