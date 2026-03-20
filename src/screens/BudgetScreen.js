import React, { useState, useEffect } from 'react';
import {
View, Text, ScrollView, StyleSheet, TouchableOpacity,
Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS, CAT_EMOJIS, DEFAULT_BUDGETS, CATEGORIES } from '../constants';
import { useLang } from '../hooks/useLang';

const fmt = (n) => '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 });

export default function BudgetScreen({ transactions, userId }) {
const { t } = useLang();
const [budgets, setBudgets] = useState(DEFAULT_BUDGETS);
const [loading, setLoading] = useState(true);
const [editCat, setEditCat] = useState(null);
const [editValue, setEditValue] = useState('');
const [saving, setSaving] = useState(false);

// Cargar presupuestos desde Firebase
useEffect(() => {
if (!userId) return;
const load = async () => {
try {
const ref = doc(db, 'budgets', userId);
const snap = await getDoc(ref);
if (snap.exists()) {
setBudgets({ ...DEFAULT_BUDGETS, ...snap.data() });
}
} catch (e) {
console.log('Error cargando presupuestos:', e);
} finally {
setLoading(false);
}
};
load();
}, [userId]);

// Guardar presupuesto editado
const saveBudget = async () => {
  if (!editCat) return;
  const clean = editValue.replace(/[^\d]/g, '');
  const val = clean === '' ? 0 : parseInt(clean, 10);
  const catToSave = editCat;
  
  // Cerrar modal primero
  setEditCat(null);
  setEditValue('');
  
  // Luego guardar en background
  try {
    const updated = { ...budgets, [catToSave]: val };
    setBudgets(updated);
    await setDoc(doc(db, 'budgets', userId), updated);
  } catch (e) {
    console.log('Error guardando presupuesto:', e);
  }
};

const openEdit = (cat) => {
setEditValue('');
setEditCat(cat);
};

// Gastos del mes actual por categoría
const now = new Date();
const monthExpenses = transactions.filter(tx => {
const d = new Date(tx.date);
return d.getMonth() === now.getMonth() &&
d.getFullYear() === now.getFullYear() &&
tx.type === 'expense';
});
const catTotals = {};
monthExpenses.forEach(tx => {
catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
});

const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
const totalSpent = Object.values(catTotals).reduce((a, b) => a + b, 0);
const totalPct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

if (loading) {
return (
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
<ActivityIndicator color={COLORS.accent} size="large" />
</View>
);
}

return (
<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
<Text style={styles.sectionTitle}>{t('budgetTitle')}</Text>


  {/* Resumen total */}
  <View style={styles.summaryCard}>
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>Total gastado</Text>
      <Text style={[styles.summaryValue, { color: totalSpent > totalBudget ? COLORS.red : COLORS.accent }]}>
        {fmt(totalSpent)}
      </Text>
    </View>
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>Presupuesto total</Text>
      <Text style={styles.summaryValue}>{fmt(totalBudget)}</Text>
    </View>
    <View style={styles.barBg}>
      <View style={[styles.barFill, {
        width: `${totalPct}%`,
        backgroundColor: totalSpent > totalBudget ? COLORS.red : COLORS.accent
      }]} />
    </View>
    <Text style={[styles.summaryLabel, { textAlign: 'right', marginTop: 4 }]}>
      {totalPct.toFixed(0)}% usado
    </Text>
  </View>

  {/* Categorías */}
  {CATEGORIES.filter(c => c !== 'Salary').map(cat => {
    const spent = catTotals[cat] || 0;
    const limit = budgets[cat] || 0;
    const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    const over = limit > 0 && spent > limit;
    const unused = limit === 0;

    return (
      <View key={cat} style={styles.catItem}>
        <View style={styles.catHeader}>
          <Text style={styles.catName}>{CAT_EMOJIS[cat]} {t('cats')[cat]}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ alignItems: 'flex-end' }}>
              {unused ? (
                <Text style={styles.noLimit}>Sin límite</Text>
              ) : (
                <Text style={[styles.catAmount, { color: over ? COLORS.red : COLORS.accent }]}>
                  {fmt(spent)} / {fmt(limit)}
                </Text>
              )}
              {over && <Text style={styles.overBadge}>{t('over')}</Text>}
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(cat)}>
              <Text style={styles.editBtnText}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>
        {!unused && (
          <>
            <View style={styles.barBg}>
              <View style={[styles.barFill, {
                width: `${pct}%`,
                backgroundColor: over ? COLORS.red : COLORS.accent2
              }]} />
            </View>
            <Text style={styles.pctText}>{pct.toFixed(0)}%</Text>
          </>
        )}
      </View>
    );
  })}

  <View style={{ height: 80 }} />

  {/* Modal editar presupuesto */}
  <Modal visible={!!editCat } transparent animationType="fade">
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.modalOverlay}
    >
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>
          {editCat ? `${CAT_EMOJIS[editCat]} ${t('cats')[editCat]}` : ''}
        </Text>
        <Text style={styles.modalSubtitle}>Límite mensual</Text>
        <TextInput
          style={styles.input}
          value={editValue}
          onChangeText={setEditValue}
          keyboardType="numeric"
          placeholder="Ej: 50000"
          placeholderTextColor={COLORS.muted}
          autoFocus
        />
        <Text style={styles.modalHint}>Poné 0 para sin límite</Text>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: COLORS.card2 }]}
            onPress={() => { setEditCat(null); setEditValue(''); }}
          >
            <Text style={{ color: COLORS.muted, fontWeight: '600' }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: COLORS.accent }]}
            onPress={saveBudget}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#000" />
              : <Text style={{ color: '#000', fontWeight: '700' }}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
</ScrollView>


);
}

const styles = StyleSheet.create({
container: { flex: 1, padding: 20 },
sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
summaryCard: {
backgroundColor: COLORS.card, borderRadius: 14, padding: 16,
borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
},
summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
summaryLabel: { fontSize: 13, color: COLORS.muted },
summaryValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },
catItem: {
backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
borderWidth: 1, borderColor: COLORS.border, marginBottom: 10,
},
catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
catName: { fontSize: 14, fontWeight: '500', color: COLORS.text },
catAmount: { fontSize: 13, fontWeight: '700' },
noLimit: { fontSize: 12, color: COLORS.muted, fontStyle: 'italic' },
overBadge: {
fontSize: 10, color: COLORS.red, backgroundColor: 'rgba(255,77,109,0.15)',
paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4,
},
editBtn: {
backgroundColor: COLORS.card2, borderRadius: 8, padding: 6,
borderWidth: 1, borderColor: COLORS.border,
},
editBtnText: { fontSize: 14 },
barBg: { backgroundColor: COLORS.card2, borderRadius: 4, height: 6, overflow: 'hidden' },
barFill: { height: 6, borderRadius: 4 },
pctText: { fontSize: 11, color: COLORS.muted, textAlign: 'right', marginTop: 4 },
// Modal
modalOverlay: {
flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
justifyContent: 'center', alignItems: 'center', padding: 20,
},
modalCard: {
backgroundColor: COLORS.card, borderRadius: 20, padding: 24,
width: '100%', borderWidth: 1, borderColor: COLORS.border,
},
modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
modalSubtitle: { fontSize: 13, color: COLORS.muted, marginBottom: 12 },
input: {
backgroundColor: COLORS.card2, borderRadius: 12, padding: 14,
color: COLORS.text, fontSize: 20, fontWeight: '700',
borderWidth: 1, borderColor: COLORS.border, marginBottom: 6,
},
modalHint: { fontSize: 11, color: COLORS.muted, marginBottom: 16 },
modalButtons: { flexDirection: 'row', gap: 10 },
modalBtn: {
flex: 1, padding: 14, borderRadius: 12,
alignItems: 'center', justifyContent: 'center',
},
});