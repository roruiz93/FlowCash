import React, { useState } from 'react';
import { View, Text,ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { LangProvider, useLang } from './src/hooks/useLang';
import { useAuth } from './src/hooks/useAuth';
import { useTransactions, useReminders } from './src/hooks/useFirestore';
import DashboardScreen from './src/screens/DashboardScreen';
import MercadoPagoScreen from './src/screens/MercadoPagoScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import ChartsScreen from './src/screens/ChartsScreen';
import LoginScreen from './src/screens/LoginScreen';
import AddTransactionModal from './src/components/AddTransactionModal';
import AddReminderModal from './src/components/AddReminderModal';
import SavingsScreen from './src/screens/SavingScreen';
import { COLORS } from './src/constants';

const TABS = ['dashboard', 'transactions', 'charts', 'budget', 'savings', 'mercadopago', 'reminders'];
const TAB_ICONS = {
  dashboard:    '🏠',
  transactions: '💸',
  charts:       '📈',
  budget:       '📊',
  savings:      '🐷',
  mercadopago:  '💳',
  reminders:    '🔔',
};
const TAB_LABELS = {
  dashboard:    'Inicio',
  transactions: 'Gastos',
  charts:       'Gráficos',
  budget:       'Presupuesto',
  savings:      'Ahorro',
  mercadopago:  'MP',
  reminders:    'Recordat.',
};

function AppContent() {
  const { t, lang, setLang } = useLang();
  const { user, loading: authLoading, login, register, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [showTxModal, setShowTxModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const { transactions, addTransaction, editTransaction, deleteTransaction } = useTransactions(user?.uid);
  const { reminders, addReminder, deleteReminder } = useReminders(user?.uid);

  // Importación masiva desde Mercado Pago
  const addTransactions = async (txArray) => {
    await Promise.all(txArray.map(tx => addTransaction({ ...tx, userId: user?.uid })));
  };

  const handleFab = () => {
    if (tab === 'reminders') setShowReminderModal(true);
    else if (tab === 'mercadopago' || tab === 'savings' || tab === 'charts') return;
    else setShowTxModal(true);
  };

  // Mostrar FAB solo en pantallas relevantes
  const showFab = !['mercadopago', 'savings', 'charts'].includes(tab);

  if (authLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.logo}>Flow<Text style={{ color: COLORS.accent }}>Cash</Text></Text>
        <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={login} onRegister={register} />;
  }

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Flow<Text style={{ color: COLORS.accent }}>Cash</Text></Text>
        <View style={styles.headerRight}>
          <View style={styles.langToggle}>
            {['en', 'es'].map(l => (
              <TouchableOpacity
                key={l}
                style={[styles.langBtn, lang === l && styles.langBtnActive]}
                onPress={() => setLang(l)}>
                <Text style={[styles.langBtnText, lang === l && { color: '#000' }]}>{l.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={{ fontSize: 20 }}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.userEmail}>{user.email}</Text>

      {/* Contenido principal */}
      <View style={styles.content}>
        {tab === 'dashboard'    && <DashboardScreen transactions={transactions} />}
        {tab === 'transactions' && <TransactionsScreen transactions={transactions} onDelete={deleteTransaction} onEdit={editTransaction} />}
        {tab === 'charts'       && <ChartsScreen transactions={transactions} />}
        {tab === 'budget'       && <BudgetScreen transactions={transactions} userId={user.uid}/>}
        {tab === 'savings'      && <SavingsScreen transactions={transactions} userId={user?.uid} />}
        {tab === 'mercadopago'  && <MercadoPagoScreen onImport={addTransactions} />}
        {tab === 'reminders'    && <RemindersScreen reminders={reminders} onDelete={deleteReminder} />}
      </View>

      {/* FAB */}
      {showFab && (
        <TouchableOpacity style={styles.fab} onPress={handleFab}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Nav con scroll horizontal para 7 tabs */}
      <View style={styles.bottomNav}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomNavScroll}>
          {TABS.map(tabName => (
            <TouchableOpacity
              key={tabName}
              style={styles.navItem}
              onPress={() => setTab(tabName)}>
              <Text style={[styles.navIcon, { opacity: tab === tabName ? 1 : 0.4 }]}>
                {TAB_ICONS[tabName]}
              </Text>
              <Text style={[styles.navLabel, tab === tabName && { color: COLORS.accent }]}>
                {TAB_LABELS[tabName]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <AddTransactionModal
        visible={showTxModal}
        onClose={() => setShowTxModal(false)}
        onAdd={addTransaction}
      />
      <AddReminderModal
        visible={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        onAdd={addReminder}
      />
    </View>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppContent />
    </LangProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  loading: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: COLORS.border,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langToggle: { flexDirection: 'row', backgroundColor: COLORS.card2, borderRadius: 20, padding: 3 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16 },
  langBtnActive: { backgroundColor: COLORS.accent },
  langBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.muted },
  logoutBtn: { padding: 4 },
  userEmail: {
    fontSize: 11, color: COLORS.muted,
    paddingHorizontal: 20, paddingVertical: 6,
    borderBottomWidth: 1, borderColor: COLORS.border,
  },
  content: { flex: 1 },
  fab: {
    position: 'absolute', bottom: 80, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.accent2, alignItems: 'center', justifyContent: 'center',
    elevation: 8, zIndex: 100,
  },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '300', marginTop: -2 },
  bottomNav: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1, borderColor: COLORS.border,
    paddingBottom: 8,
  },
  bottomNavScroll: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  navItem: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, minWidth: 60 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 10, color: COLORS.muted, marginTop: 3 },
});