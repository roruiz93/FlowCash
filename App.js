import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, useWindowDimensions, Alert,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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

// Altura fija del bottom nav (sin insets)
const BOTTOM_NAV_HEIGHT = 60;

function AppContent() {
  const { t, lang, setLang } = useLang();
  const { user, loading: authLoading, login, register, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [showTxModal, setShowTxModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Escala responsiva basada en ancho de pantalla (base 390px = iPhone 14)
  const scale = Math.min(width / 390, 1.2);
  const isSmall = height < 700;

  const { transactions, addTransaction, editTransaction, deleteTransaction, hasMore, loadMore, firestoreError, clearFirestoreError } = useTransactions(user?.uid);

  useEffect(() => {
    if (firestoreError) {
      Alert.alert(t('error'), t('firestoreError'));
      clearFirestoreError();
    }
  }, [firestoreError]);
  const { reminders, addReminder, deleteReminder } = useReminders(user?.uid);

  const addTransactions = async (txArray) => {
    await Promise.all(txArray.map(tx => addTransaction(
      tx.description || tx.desc,
      tx.amount,
      tx.category,
      tx.type,
      tx.date,
    )));
  };

  const handleFab = () => {
    if (tab === 'reminders') setShowReminderModal(true);
    else if (tab === 'mercadopago' || tab === 'savings' || tab === 'charts') return;
    else setShowTxModal(true);
  };

  const showFab = !['mercadopago', 'savings', 'charts'].includes(tab);

  // Altura total del nav incluyendo inset inferior del sistema
  const bottomNavTotal = BOTTOM_NAV_HEIGHT + insets.bottom;

  if (authLoading) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <Text style={[styles.logo, { fontSize: 22 * scale }]}>
          Flow<Text style={{ color: COLORS.accent }}>Cash</Text>
        </Text>
        <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={login} onRegister={register} />;
  }

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} translucent />

      {/* Espacio para status bar del sistema */}
      <View style={{ height: insets.top, backgroundColor: COLORS.bg }} />

      {/* Header */}
      <View style={[styles.header, { paddingVertical: isSmall ? 10 : 14 }]}>
        <Text style={[styles.logo, { fontSize: 20 * scale }]}>
          Flow<Text style={{ color: COLORS.accent }}>Cash</Text>
        </Text>
        <View style={styles.headerRight}>
          <View style={styles.langToggle}>
            {['en', 'es'].map(l => (
              <TouchableOpacity
                key={l}
                style={[styles.langBtn, lang === l && styles.langBtnActive]}
                onPress={() => setLang(l)}>
                <Text style={[styles.langBtnText, lang === l && { color: '#000' }]}>
                  {l.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.userEmail, { fontSize: 10 * scale }]}>{user.email}</Text>

      {/* Contenido principal */}
      <View style={styles.content}>
        {tab === 'dashboard'    && <DashboardScreen transactions={transactions} bottomOffset={bottomNavTotal} />}
        {tab === 'transactions' && <TransactionsScreen transactions={transactions} onDelete={deleteTransaction} onEdit={editTransaction} hasMore={hasMore} onLoadMore={loadMore} bottomOffset={bottomNavTotal} />}
        {tab === 'charts'       && <ChartsScreen transactions={transactions} bottomOffset={bottomNavTotal} />}
        {tab === 'budget'       && <BudgetScreen transactions={transactions} userId={user.uid} bottomOffset={bottomNavTotal} />}
        {tab === 'savings'      && <SavingsScreen transactions={transactions} userId={user?.uid} bottomOffset={bottomNavTotal} />}
        {tab === 'mercadopago'  && <MercadoPagoScreen onImport={addTransactions} bottomOffset={bottomNavTotal} />}
        {tab === 'reminders'    && <RemindersScreen reminders={reminders} onDelete={deleteReminder} bottomOffset={bottomNavTotal} />}
      </View>

      {/* FAB */}
      {showFab && (
        <TouchableOpacity
          style={[styles.fab, { bottom: bottomNavTotal + 16 }]}
          onPress={handleFab}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Nav con scroll horizontal para 7 tabs */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomNavScroll}>
          {TABS.map(tabName => (
            <TouchableOpacity
              key={tabName}
              style={[styles.navItem, { minWidth: width / 5 }]}
              onPress={() => setTab(tabName)}>
              <Text style={[styles.navIcon, { opacity: tab === tabName ? 1 : 0.4 }]}>
                {TAB_ICONS[tabName]}
              </Text>
              <Text style={[styles.navLabel, tab === tabName && { color: COLORS.accent }]}>
                {t(tabName)}
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
    <SafeAreaProvider>
      <LangProvider>
        <AppContent />
      </LangProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  loading: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  logo: { fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1, borderColor: COLORS.border,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langToggle: { flexDirection: 'row', backgroundColor: COLORS.card2, borderRadius: 20, padding: 3 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16 },
  langBtnActive: { backgroundColor: COLORS.accent },
  langBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.muted },
  logoutBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: COLORS.card2, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  logoutText: { fontSize: 13, fontWeight: '600', color: COLORS.red },
  userEmail: {
    color: COLORS.muted,
    paddingHorizontal: 20, paddingVertical: 6,
    borderBottomWidth: 1, borderColor: COLORS.border,
  },
  content: { flex: 1 },
  fab: {
    position: 'absolute', right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.accent2, alignItems: 'center', justifyContent: 'center',
    elevation: 8, zIndex: 100,
  },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '300', marginTop: -2 },
  bottomNav: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1, borderColor: COLORS.border,
    height: undefined,
  },
  bottomNavScroll: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  navItem: { alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 10, color: COLORS.muted, marginTop: 3 },
});
