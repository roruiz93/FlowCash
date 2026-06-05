import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, CATEGORIES, CAT_EMOJIS } from '../constants';
import { useLang } from '../hooks/useLang';

export default function AddTransactionModal({ visible, onClose, onAdd, initialData }) {
const { t } = useLang();
const [type, setType] = useState('expense');
const [desc, setDesc] = useState('');
const [amount, setAmount] = useState('');
const [category, setCategory] = useState('Food');

// Si viene initialData, pre-cargar los valores para editar
useEffect(() => {
if (initialData) {
setType(initialData.type || 'expense');
setDesc(initialData.desc || '');
setAmount(initialData.amount ? String(initialData.amount) : '');
setCategory(initialData.category || 'Food');
} else {
setType('expense');
setDesc('');
setAmount('');
setCategory('Food');
}
}, [initialData, visible]);

const isEditing = !!initialData;

const handleAdd = () => {
if (!desc.trim() || !amount) return;
onAdd(desc.trim(), parseFloat(amount), category, type);
setDesc(''); setAmount(''); setType('expense'); setCategory('Food');
onClose();
};

return (
<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
<KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
<TouchableOpacity style={styles.backdrop} onPress={onClose} />
<View style={styles.modal}>
<Text style={styles.title}>{isEditing ? t('editTx') : t('addTx')}</Text>
<View style={styles.typeRow}>
<TouchableOpacity
style={[styles.typeBtn, type === 'income' && styles.typeBtnIncomeActive]}
onPress={() => setType('income')}>
<Text style={[styles.typeBtnText, type === 'income' && { color: COLORS.accent }]}>{t('income')}</Text>
</TouchableOpacity>
<TouchableOpacity
style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpenseActive]}
onPress={() => setType('expense')}>
<Text style={[styles.typeBtnText, type === 'expense' && { color: COLORS.red }]}>{t('expense')}</Text>
</TouchableOpacity>
</View>
<Text style={styles.label}>{t('desc')}</Text>
<TextInput
style={styles.input} value={desc} onChangeText={setDesc}
placeholder={t('descPlaceholder')} placeholderTextColor={COLORS.muted} />
<Text style={styles.label}>{t('amount')}</Text>
<TextInput
style={styles.input} value={amount} onChangeText={setAmount}
placeholder="0.00" keyboardType="numeric" placeholderTextColor={COLORS.muted} />
<Text style={styles.label}>{t('category')}</Text>
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
{CATEGORIES.map(cat => (
<TouchableOpacity
key={cat}
style={[styles.catChip, category === cat && styles.catChipActive]}
onPress={() => setCategory(cat)}>
<Text style={styles.catChipText}>{CAT_EMOJIS[cat]} {t('cats')[cat]}</Text>
</TouchableOpacity>
))}
</ScrollView>
<TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
<Text style={styles.addBtnText}>{isEditing ? t('saveChanges') : t('add')}</Text>
</TouchableOpacity>
</View>
</KeyboardAvoidingView>
</Modal>
);
}

const styles = StyleSheet.create({
overlay: { flex: 1, justifyContent: 'flex-end' },
backdrop: { flex: 1 },
modal: {
backgroundColor: COLORS.card, borderRadius: 28, padding: 24,
paddingBottom: 40, borderTopWidth: 1, borderColor: COLORS.border,
},
title: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
typeBtn: {
flex: 1, padding: 10, borderRadius: 12, backgroundColor: COLORS.card2,
alignItems: 'center', borderWidth: 1, borderColor: 'transparent',
},
typeBtnIncomeActive: { backgroundColor: 'rgba(0,229,160,0.15)', borderColor: COLORS.accent },
typeBtnExpenseActive: { backgroundColor: 'rgba(255,77,109,0.15)', borderColor: COLORS.red },
typeBtnText: { fontSize: 14, fontWeight: '500', color: COLORS.muted },
label: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
input: {
backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border,
borderRadius: 12, padding: 12, color: COLORS.text, fontSize: 16, marginBottom: 14,
},
catChip: {
paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
backgroundColor: COLORS.card2, marginRight: 8, borderWidth: 1, borderColor: 'transparent',
},
catChipActive: { borderColor: COLORS.accent2, backgroundColor: 'rgba(124,92,255,0.15)' },
catChipText: { fontSize: 13, color: COLORS.text },
addBtn: { backgroundColor: COLORS.accent2, borderRadius: 14, padding: 14, alignItems: 'center' },
addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});