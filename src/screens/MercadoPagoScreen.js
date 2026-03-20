import React, { useState } from 'react';
import {
View, Text, ScrollView, StyleSheet, TouchableOpacity,
ActivityIndicator, Alert, Switch
} from 'react-native';
import { COLORS } from '../constants';
import { useLang } from '../hooks/useLang';
import { useMercadoPagoGmail } from '../hooks/UseMercadoPagoGmail';

const fmt = (n) => '$' + Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });

const CATEGORY_OPTIONS_EXPENSE = [
{ key: 'comida', label: '🍔 Comida' },
{ key: 'transporte', label: '🚗 Transporte' },
{ key: 'servicios', label: '💡 Servicios' },
{ key: 'entretenimiento', label: '🎬 Entrete.' },
{ key: 'salud', label: '💊 Salud' },
{ key: 'compras', label: '🛍 Compras' },
{ key: 'otros', label: '📦 Otros' },
];

const CATEGORY_OPTIONS_INCOME = [
{ key: 'sueldo', label: '💼 Sueldo' },
{ key: 'freelance', label: '💻 Freelance' },
{ key: 'transferencia', label: '💸 Transfer.' },
{ key: 'otros_ingresos', label: '📥 Otros' },
];

export default function MercadoPagoScreen({ onImport }) {
const { t } = useLang();
const {
connected, loading, syncing, error,
pendingTx, lastSync, request,
connectGmail, disconnectGmail, syncEmails, setPendingTx,
} = useMercadoPagoGmail();

const [selectedIds, setSelectedIds] = useState({});
const [editCategories, setEditCategories] = useState({});
const [daysBack, setDaysBack] = useState(30);
const [importing, setImporting] = useState(false);

const toggleSelect = (id) => setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }));
const selectAll = () => {
const all = {};
pendingTx.forEach(tx => { all[tx.id] = true; });
setSelectedIds(all);
};
const deselectAll = () => setSelectedIds({});
const selectedCount = Object.values(selectedIds).filter(Boolean).length;

const handleImport = async () => {
const toImport = pendingTx
.filter(tx => selectedIds[tx.id])
.map(tx => ({
amount: tx.amount, type: tx.type, description: tx.description,
date: tx.date, category: editCategories[tx.id] || tx.category, source: 'mercadopago',
}));


if (toImport.length === 0) {
  Alert.alert(t('mpNoSelection'), t('mpNoSelectionMsg'));
  return;
}

setImporting(true);
try {
  await onImport(toImport);
  const importedIds = new Set(pendingTx.filter(tx => selectedIds[tx.id]).map(tx => tx.id));
  setPendingTx(prev => prev.filter(tx => !importedIds.has(tx.id)));
  setSelectedIds({});
  Alert.alert('✅', toImport.length + t('mpImportDone'));
} catch (e) {
  Alert.alert('Error', t('mpImportError'));
}
setImporting(false);


};

const handleDisconnect = () => {
Alert.alert(
t('mpDisconnectTitle'),
t('mpDisconnectMsg'),
[
{ text: t('cancel'), style: 'cancel' },
{ text: t('mpDisconnect'), style: 'destructive', onPress: disconnectGmail },
]
);
};

return (
<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>


  {/* Header */}
  <View style={styles.header}>
    <Text style={styles.mpIcon}>💳</Text>
    <Text style={styles.title}>{t('mpTitle')}</Text>
    <Text style={styles.subtitle}>{t('mpSubtitle')}</Text>
  </View>

  {/* Estado conexión */}
  <View style={[styles.statusCard, { borderColor: connected ? 'rgba(0,229,160,0.4)' : 'rgba(255,77,109,0.3)' }]}>
    <View style={styles.statusRow}>
      <View style={styles.statusLeft}>
        <Text style={styles.statusDot}>{connected ? '🟢' : '⚫'}</Text>
        <View>
          <Text style={styles.statusTitle}>
            {connected ? t('mpConnected') : t('mpDisconnected')}
          </Text>
          {lastSync && (
            <Text style={styles.statusSub}>
              {t('mpLastSync')}{lastSync.toLocaleDateString('es-AR')} {lastSync.getHours()}:{String(lastSync.getMinutes()).padStart(2, '0')}
            </Text>
          )}
        </View>
      </View>
      {connected && (
        <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
          <Text style={styles.disconnectText}>{t('mpDisconnect')}</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>

  {error && (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>⚠️ {error}</Text>
    </View>
  )}

  {/* Botón conectar */}
  {!connected && (
    <View style={styles.connectSection}>
      <Text style={styles.connectInfo}>
        {t('mpPrivacyNote')}<Text style={{ color: COLORS.accent, fontWeight: '700' }}>{t('mpReadOnly')}</Text>{t('mpPrivacyNote2')}
      </Text>
      <TouchableOpacity
        style={[styles.connectBtn, (!request || loading) && { opacity: 0.6 }]}
        onPress={connectGmail}
        disabled={!request || loading}>
        {loading
          ? <ActivityIndicator color="#000" />
          : <Text style={styles.connectBtnText}>{t('mpConnect')}</Text>
        }
      </TouchableOpacity>
    </View>
  )}

  {/* Sync */}
  {connected && (
    <View style={styles.syncSection}>
      <Text style={styles.sectionLabel}>{t('mpSearchLabel')}</Text>
      <View style={styles.daysRow}>
        {[7, 15, 30, 60].map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.dayBtn, daysBack === d && styles.dayBtnActive]}
            onPress={() => setDaysBack(d)}>
            <Text style={[styles.dayBtnText, daysBack === d && styles.dayBtnTextActive]}>{d}d</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.syncBtn, syncing && { opacity: 0.6 }]}
        onPress={() => syncEmails(daysBack)}
        disabled={syncing}>
        {syncing
          ? <><ActivityIndicator color="#000" size="small" /><Text style={styles.syncBtnText}>{t('mpSearching')}</Text></>
          : <Text style={styles.syncBtnText}>{t('mpSearchBtn')}</Text>
        }
      </TouchableOpacity>
    </View>
  )}

  {/* Lista transacciones */}
  {pendingTx.length > 0 && (
    <View style={styles.pendingSection}>
      <View style={styles.pendingHeader}>
        <Text style={styles.sectionLabel}>{pendingTx.length + t('mpFoundLabel')}</Text>
        <View style={styles.selectBtns}>
          <TouchableOpacity onPress={selectAll}>
            <Text style={styles.selectAllText}>{t('mpSelectAll')}</Text>
          </TouchableOpacity>
          <Text style={styles.selectSep}>·</Text>
          <TouchableOpacity onPress={deselectAll}>
            <Text style={styles.selectAllText}>{t('mpSelectNone')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {pendingTx.map((tx) => {
        const isSelected = !!selectedIds[tx.id];
        const catOptions = tx.type === 'expense' ? CATEGORY_OPTIONS_EXPENSE : CATEGORY_OPTIONS_INCOME;
        const currentCat = editCategories[tx.id] || tx.category;
        return (
          <View key={tx.id} style={[styles.txCard, isSelected && styles.txCardSelected]}>
            <View style={styles.txTop}>
              <Switch
                value={isSelected}
                onValueChange={() => toggleSelect(tx.id)}
                trackColor={{ false: COLORS.border, true: COLORS.accent + '88' }}
                thumbColor={isSelected ? COLORS.accent : COLORS.muted}
              />
              <View style={styles.txInfo}>
                <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'expense' ? COLORS.red : COLORS.accent }]}>
                {tx.type === 'expense' ? '-' : '+'}{fmt(tx.amount)}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {catOptions.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.catChip, currentCat === cat.key && styles.catChipActive]}
                  onPress={() => setEditCategories(prev => ({ ...prev, [tx.id]: cat.key }))}>
                  <Text style={[styles.catChipText, currentCat === cat.key && styles.catChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      })}

      <TouchableOpacity
        style={[styles.importBtn, (selectedCount === 0 || importing) && { opacity: 0.5 }]}
        onPress={handleImport}
        disabled={selectedCount === 0 || importing}>
        {importing
          ? <ActivityIndicator color="#000" />
          : <Text style={styles.importBtnText}>{t('mpImportBtn')}{selectedCount > 0 ? selectedCount : ''}</Text>
        }
      </TouchableOpacity>
    </View>
  )}

  {/* Vacío */}
  {connected && !syncing && pendingTx.length === 0 && lastSync && (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyText}>{t('mpEmpty')}{daysBack}{t('mpEmptyDays')}</Text>
      <Text style={styles.emptySubtext}>{t('mpEmptyHint')}</Text>
    </View>
  )}

  {/* Privacidad */}
  <View style={styles.privacyBox}>
    <Text style={styles.privacyTitle}>{t('mpPrivacyTitle')}</Text>
    <Text style={styles.privacyText}>{t('mpPrivacyText')}</Text>
  </View>

  <View style={{ height: 80 }} />
</ScrollView>


);
}

const styles = StyleSheet.create({
container: { flex: 1, padding: 20 },
header: { alignItems: 'center', marginBottom: 20 },
mpIcon: { fontSize: 48, marginBottom: 8 },
title: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 6 },
subtitle: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 18 },
statusCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 14 },
statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
statusDot: { fontSize: 18 },
statusTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
statusSub: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
disconnectBtn: { backgroundColor: 'rgba(255,77,109,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
disconnectText: { fontSize: 12, color: COLORS.red, fontWeight: '600' },
errorBox: { backgroundColor: 'rgba(255,77,109,0.1)', borderRadius: 12, padding: 12, marginBottom: 14 },
errorText: { fontSize: 13, color: COLORS.red },
connectSection: { marginBottom: 20 },
connectInfo: { fontSize: 13, color: COLORS.muted, lineHeight: 20, backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
connectBtn: { backgroundColor: COLORS.accent, borderRadius: 14, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
connectBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
syncSection: { marginBottom: 20 },
sectionLabel: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
daysRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
dayBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
dayBtnActive: { backgroundColor: COLORS.accent2, borderColor: COLORS.accent2 },
dayBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.muted },
dayBtnTextActive: { color: '#fff' },
syncBtn: { backgroundColor: COLORS.accent2, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
syncBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
pendingSection: { marginBottom: 14 },
pendingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
selectBtns: { flexDirection: 'row', alignItems: 'center', gap: 6 },
selectAllText: { fontSize: 13, color: COLORS.accent2, fontWeight: '600' },
selectSep: { color: COLORS.muted },
txCard: { backgroundColor: COLORS.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
txCardSelected: { borderColor: COLORS.accent + '88', backgroundColor: 'rgba(0,229,160,0.05)' },
txTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
txInfo: { flex: 1 },
txDesc: { fontSize: 13, fontWeight: '600', color: COLORS.text },
txDate: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
txAmount: { fontSize: 15, fontWeight: '800' },
catScroll: { marginLeft: 46 },
catChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, marginRight: 6 },
catChipActive: { backgroundColor: COLORS.accent2, borderColor: COLORS.accent2 },
catChipText: { fontSize: 11, color: COLORS.muted },
catChipTextActive: { color: '#fff', fontWeight: '600' },
importBtn: { backgroundColor: COLORS.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
importBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
emptyBox: { alignItems: 'center', padding: 30, backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
emptyIcon: { fontSize: 40, marginBottom: 12 },
emptyText: { fontSize: 14, color: COLORS.text, textAlign: 'center', marginBottom: 6 },
emptySubtext: { fontSize: 12, color: COLORS.muted },
privacyBox: { backgroundColor: 'rgba(124,92,255,0.08)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(124,92,255,0.2)', marginBottom: 14 },
privacyTitle: { fontSize: 13, fontWeight: '700', color: COLORS.accent2, marginBottom: 6 },
privacyText: { fontSize: 12, color: COLORS.muted, lineHeight: 18 },
});