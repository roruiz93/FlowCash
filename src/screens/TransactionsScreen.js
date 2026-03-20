import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, CAT_EMOJIS, CAT_COLORS } from '../constants';
import { useLang } from '../hooks/useLang';
import AddTransactionModal from '../components/AddTransactionModal';

const fmt = (n) => '$' + Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });

export default function TransactionsScreen({ transactions, onDelete, onEdit }) {
const { t } = useLang();
const [editingTx, setEditingTx] = useState(null);

const confirmDelete = (id) => {
Alert.alert(
t('deleteConfirm'),
t('deleteMsg'),
[
{ text: t('cancel'), style: 'cancel' },
{ text: t('delete'), style: 'destructive', onPress: () => onDelete(id) },
]
);
};

return (
<View style={{ flex: 1 }}>
<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
<Text style={styles.sectionTitle}>{t('transactions')}</Text>
{transactions.length === 0 ? (
<View style={styles.empty}>
<Text style={styles.emptyIcon}>💸</Text>
<Text style={styles.emptyText}>{t('noTx')}</Text>
</View>
) : (
transactions.map(tx => {
const d = new Date(tx.date);
return (
<View key={tx.id} style={styles.txItem}>
<View style={[styles.txIcon, { backgroundColor: (CAT_COLORS[tx.category] || '#7c5cff') + '22' }]}>
<Text style={{ fontSize: 20 }}>{CAT_EMOJIS[tx.category] || '📦'}</Text>
</View>
<View style={styles.txInfo}>
<Text style={styles.txName}>{tx.desc}</Text>
<Text style={styles.txCat}>{t('cats')[tx.category]}</Text>
<Text style={styles.txDate}>{d.getDate()}/{d.getMonth() + 1}/{d.getFullYear()}</Text>
</View>
<View style={styles.actions}>
<Text style={[styles.txAmount, { color: tx.type === 'income' ? COLORS.accent : COLORS.red }]}>
{tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
</Text>
<View style={styles.btnRow}>
<TouchableOpacity style={styles.editBtn} onPress={() => setEditingTx(tx)}>
<Text style={{ fontSize: 16 }}>✏️</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(tx.id)}>
<Text style={{ fontSize: 16 }}>🗑</Text>
</TouchableOpacity>
</View>
</View>
</View>
);
})
)}
<View style={{ height: 80 }} />
</ScrollView>

```
  {editingTx && (
    <AddTransactionModal
      visible={!!editingTx}
      onClose={() => setEditingTx(null)}
      onAdd={(desc, amount, category, type) => {
        onEdit(editingTx.id, desc, amount, category, type);
        setEditingTx(null);
      }}
      initialData={editingTx}
    />
  )}
</View>


);
}

const styles = StyleSheet.create({
container: { flex: 1, padding: 20 },
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
txDate: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
actions: { alignItems: 'flex-end', gap: 6 },
txAmount: { fontSize: 15, fontWeight: '700' },
btnRow: { flexDirection: 'row', gap: 8 },
editBtn: { padding: 4 },
deleteBtn: { padding: 4 },
empty: { alignItems: 'center', paddingVertical: 40 },
emptyIcon: { fontSize: 48, marginBottom: 12 },
emptyText: { color: COLORS.muted, textAlign: 'center', lineHeight: 22 },
});