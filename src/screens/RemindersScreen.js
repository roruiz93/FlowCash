import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants';
import { useLang } from '../hooks/useLang';

const fmt = (n) => '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 });

export default function RemindersScreen({ reminders, onDelete }) {
  const { t } = useLang();
  const now = new Date();

  const getStatus = (due) => {
    const parts = due.split('/');
    const d = new Date(parts[2] + '-' + parts[1] + '-' + parts[0]);
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: t('statusOverdue'), color: COLORS.red, bg: 'rgba(255,77,109,0.15)' };
    if (diff <= 3) return { label: t('statusSoon'), color: '#ffb347', bg: 'rgba(255,179,71,0.15)' };
    return { label: t('statusOk'), color: COLORS.accent, bg: 'rgba(0,229,160,0.15)' };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>{t('reminders')}</Text>
      {reminders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>{t('noReminders')}</Text>
        </View>
      ) : (
        reminders.map(r => {
          const status = getStatus(r.due);
          return (
            <View key={r.id} style={[styles.item, { borderColor: status.color + '55' }]}>
              <View style={styles.icon}><Text style={{ fontSize: 20 }}>🔔</Text></View>
              <View style={styles.info}>
                <Text style={styles.name}>{r.name}</Text>
                <Text style={styles.date}>📅 {r.due}</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                {r.amount ? <Text style={styles.amount}>{fmt(r.amount)}</Text> : null}
                <TouchableOpacity onPress={() => onDelete(r.id)}>
                  <Text style={{ fontSize: 18 }}>🗑</Text>
                </TouchableOpacity>
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  item: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, marginBottom: 10,
  },
  icon: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(124,92,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  date: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: '500' },
  amount: { fontSize: 15, fontWeight: '700', color: COLORS.accent2 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.muted, textAlign: 'center', lineHeight: 22 },
});
