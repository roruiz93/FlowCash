import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS } from '../constants';
import { useLang } from '../hooks/useLang';

export default function AddReminderModal({ visible, onClose, onAdd }) {
  const { t } = useLang();
  const [name, setName] = useState('');
  const [due, setDue] = useState('');
  const [amount, setAmount] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !due.trim()) return;
    onAdd(name.trim(), due.trim(), amount ? parseFloat(amount) : undefined);
    setName(''); setDue(''); setAmount('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.modal}>
          <Text style={styles.title}>{t('addReminder')}</Text>
          <Text style={styles.label}>{t('reminderName')}</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej: Tarjeta, Alquiler..." placeholderTextColor={COLORS.muted} />
          <Text style={styles.label}>{t('reminderDue')}</Text>
          <TextInput style={styles.input} value={due} onChangeText={setDue} placeholder="31/03/2026" placeholderTextColor={COLORS.muted} keyboardType="numeric" />
          <Text style={styles.label}>{t('reminderAmt')}</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="numeric" placeholderTextColor={COLORS.muted} />
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>{t('addReminder')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  modal: { backgroundColor: COLORS.card, borderRadius: 28, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: COLORS.border },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  label: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  input: { backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, color: COLORS.text, fontSize: 16, marginBottom: 14 },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 14, padding: 14, alignItems: 'center' },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
});
