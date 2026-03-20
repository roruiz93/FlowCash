import React, { useState, useEffect } from 'react';
import {
View, Text, ScrollView, StyleSheet, TouchableOpacity,
TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS } from '../constants';
import { useLang } from '../hooks/useLang';

const fmt = (n) => '$' + Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });
const fmtUSD = (n) => 'U$S ' + n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
const fmtPct = (n) => n.toFixed(1) + '%';

const FALLBACK_RATES = {
mercadopago: { tna: 97, label: 'Mercado Pago', icon: '💙', color: '#009ee3', desc: 'Rinde todos los días, retiro inmediato' },
uala: { tna: 95, label: 'Ualá', icon: '💜', color: '#7c5cff', desc: 'Cuenta remunerada, fácil de usar' },
fci: { tna: 105, label: 'FCI Money Market', icon: '📈', color: '#00e5a0', desc: 'Fondos comunes de inversión' },
};

export default function SavingsScreen({ transactions, userId }) {
const { t } = useLang();
const [goal, setGoal] = useState(0);
const [goalInput, setGoalInput] = useState('');
const [showGoalModal, setShowGoalModal] = useState(false);
const [loadingGoal, setLoadingGoal] = useState(true);
const [activeTab, setActiveTab] = useState('overview');

const [rates, setRates] = useState(null);
const [dolar, setDolar] = useState(null);
const [loadingRates, setLoadingRates] = useState(true);
const [ratesError, setRatesError] = useState(false);
const [lastUpdated, setLastUpdated] = useState(null);

const TIPS = [
{ icon: '☕', tip: t('tip1') },
{ icon: '📱', tip: t('tip2') },
{ icon: '🛒', tip: t('tip3') },
{ icon: '🚗', tip: t('tip4') },
{ icon: '💡', tip: t('tip5') },
{ icon: '🎯', tip: t('tip6') },
{ icon: '🏠', tip: t('tip7') },
];

useEffect(() => {
if (!userId) return;
const load = async () => {
try {
const snap = await getDoc(doc(db, 'savings', userId));
if (snap.exists()) setGoal(snap.data().monthlyGoal || 0);
} catch (e) {}
setLoadingGoal(false);
};
load();
}, [userId]);

useEffect(() => {
const loadRates = async () => {
setLoadingRates(true);
setRatesError(false);
try {
let firebaseRates = { ...FALLBACK_RATES };
try {
const snap = await getDoc(doc(db, 'config', 'investmentRates'));
if (snap.exists()) {
const data = snap.data();
firebaseRates = {
mercadopago: { ...FALLBACK_RATES.mercadopago, tna: data.mercadopago ?? FALLBACK_RATES.mercadopago.tna },
uala: { ...FALLBACK_RATES.uala, tna: data.uala ?? FALLBACK_RATES.uala.tna },
fci: { ...FALLBACK_RATES.fci, tna: data.fci ?? FALLBACK_RATES.fci.tna },
};
}
} catch (e) {}


    let bcraRate = null;
    try {
      const bcraRes = await fetch(
        'https://api.bcra.gob.ar/estadisticas/v3.0/monetarias/tnaPlazos30a44dias',
        { headers: { Accept: 'application/json' } }
      );
      if (bcraRes.ok) {
        const bcraData = await bcraRes.json();
        const results = bcraData?.results;
        if (results && results.length > 0) {
          bcraRate = results[results.length - 1]?.valor ?? null;
        }
      }
    } catch {
      bcraRate = 97;
    }

    let mepData = null;
    try {
      const dolarRes = await fetch('https://dolarapi.com/v1/dolares/bolsa');
      if (dolarRes.ok) {
        const d = await dolarRes.json();
        mepData = { compra: d.compra, venta: d.venta };
      }
    } catch (e) {}

    setRates({ ...firebaseRates, bcraRate });
    setDolar(mepData);
    setLastUpdated(new Date());
  } catch (e) {
    setRatesError(true);
    setRates({ ...FALLBACK_RATES, bcraRate: null });
  }
  setLoadingRates(false);
};
loadRates();


}, []);

const saveGoal = async () => {
const val = parseFloat(goalInput);
if (!val || val <= 0) return;
try {
await setDoc(doc(db, 'savings', userId), { monthlyGoal: val }, { merge: true });
setGoal(val);
setShowGoalModal(false);
setGoalInput('');
} catch (e) {}
};

const now = new Date();
const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
const daysPassed = now.getDate();
const daysLeft = daysInMonth - daysPassed;

const monthTx = transactions.filter(tx => {
const d = new Date(tx.date);
return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
});
const monthIncome = monthTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
const monthExpense = monthTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
const monthSaved = monthIncome - monthExpense;
const progress = goal > 0 ? Math.min(100, (monthSaved / goal) * 100) : 0;
const onTrack = goal > 0 && monthSaved >= (goal * daysPassed / daysInMonth);

const dailyRate = daysPassed > 0 ? monthSaved / daysPassed : 0;
const projected = dailyRate * daysInMonth;
const capital = monthSaved > 0 ? monthSaved : goal;

const calcReturn = (tna) => ({
monthly: capital * (tna / 100 / 12),
yearly: capital * (tna / 100),
});

const MONTH_NAMES = t('months');
const history = [];
for (let i = 5; i >= 0; i--) {
const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
const txs = transactions.filter(tx => {
const td = new Date(tx.date);
return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
});
const inc = txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
const exp = txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
history.push({ label: MONTH_NAMES[d.getMonth()], saved: inc - exp, goal });
}

const tipOfDay = TIPS[now.getDate() % TIPS.length];

const investments = rates ? [
{
name: 'Plazo Fijo BCRA', icon: '🏦',
tna: rates.bcraRate ?? 0, color: '#4ecdc4',
desc: rates.bcraRate ? 'Tasa oficial BCRA (60 días)' : 'No disponible ahora',
live: !!rates.bcraRate, type: 'ARS',
},
{ name: rates.mercadopago.label, icon: rates.mercadopago.icon, tna: rates.mercadopago.tna, color: rates.mercadopago.color, desc: rates.mercadopago.desc, live: false, type: 'ARS' },
{ name: rates.uala.label, icon: rates.uala.icon, tna: rates.uala.tna, color: rates.uala.color, desc: rates.uala.desc, live: false, type: 'ARS' },
{ name: rates.fci.label, icon: rates.fci.icon, tna: rates.fci.tna, color: rates.fci.color, desc: rates.fci.desc, live: false, type: 'ARS' },
{
name: 'Dólar MEP', icon: '💵', tna: 0, color: '#ffe66d',
desc: dolar ? ('Compra: $' + dolar.compra + '  ·  Venta: $' + dolar.venta) : 'Sin cotización',
live: !!dolar, type: 'USD',
},
] : [];

if (loadingGoal) {
return <View style={styles.center}><ActivityIndicator color={COLORS.accent} /></View>;
}

return (
<View style={{ flex: 1 }}>
<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>


    {/* Tabs */}
    <View style={styles.tabs}>
      {[
        { key: 'overview', label: t('tabSave') },
        { key: 'history', label: t('tabHistory') },
        { key: 'invest', label: t('tabInvest') },
        { key: 'tips', label: t('tabTips') },
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          onPress={() => setActiveTab(tab.key)}>
          <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* OVERVIEW */}
    {activeTab === 'overview' && (
      <>
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View>
              <Text style={styles.cardLabel}>{t('monthlyGoal')}</Text>
              <Text style={styles.goalAmount}>{goal > 0 ? fmt(goal) : t('noGoal')}</Text>
            </View>
            <TouchableOpacity
              style={styles.editGoalBtn}
              onPress={() => { setGoalInput(goal ? String(goal) : ''); setShowGoalModal(true); }}>
              <Text style={styles.editGoalText}>{goal > 0 ? t('editGoal') : t('setGoal')}</Text>
            </TouchableOpacity>
          </View>

          {goal > 0 && (
            <>
              <View style={styles.barBg}>
                <View style={[styles.barFill, {
                  width: Math.max(0, progress) + '%',
                  backgroundColor: progress >= 100 ? COLORS.accent : progress >= 60 ? '#ffe66d' : COLORS.red
                }]} />
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>{t('savedSoFar')}: {fmt(monthSaved)}</Text>
                <Text style={styles.progressText}>{fmtPct(Math.max(0, progress))}</Text>
              </View>
              <View style={[styles.statusBadge, {
                backgroundColor: onTrack ? 'rgba(0,229,160,0.15)' : 'rgba(255,77,109,0.15)'
              }]}>
                <Text style={{ fontSize: 20 }}>{onTrack ? '🟢' : '🔴'}</Text>
                <Text style={[styles.statusText, { color: onTrack ? COLORS.accent : COLORS.red }]}>
                  {onTrack ? t('onTrack') : t('offTrack') + fmt(Math.max(0, goal - monthSaved)) + t('toGoal')}
                </Text>
              </View>
            </>
          )}
        </View>

        {goal > 0 && daysPassed > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('projectionTitle')}</Text>
            <Text style={[styles.projAmount, { color: projected >= goal ? COLORS.accent : COLORS.red }]}>
              {fmt(projected)}
            </Text>
            <Text style={styles.projDesc}>
              {projected >= goal
                ? t('projectionOver') + fmt(projected - goal)
                : t('projectionUnder') + fmt(goal - projected)}
            </Text>
            <View style={styles.projStats}>
              <View style={styles.projStat}>
                <Text style={styles.projStatLabel}>{t('daysPassed')}</Text>
                <Text style={styles.projStatVal}>{daysPassed}</Text>
              </View>
              <View style={styles.projStat}>
                <Text style={styles.projStatLabel}>{t('daysLeft')}</Text>
                <Text style={styles.projStatVal}>{daysLeft}</Text>
              </View>
              <View style={styles.projStat}>
                <Text style={styles.projStatLabel}>{t('dailySaving')}</Text>
                <Text style={[styles.projStatVal, { color: dailyRate >= 0 ? COLORS.accent : COLORS.red }]}>
                  {fmt(dailyRate)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>{t('tipOfDay')}</Text>
          <Text style={styles.tipIconText}>{tipOfDay.icon}</Text>
          <Text style={styles.tipText}>{tipOfDay.tip}</Text>
        </View>
      </>
    )}

    {/* HISTORIAL */}
    {activeTab === 'history' && (
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('historyTitle')}</Text>
        {history.map((m, i) => {
          const pct = m.goal > 0 ? Math.min(100, (m.saved / m.goal) * 100) : 0;
          const isPositive = m.saved >= 0;
          return (
            <View key={i} style={styles.histItem}>
              <View style={styles.histHeader}>
                <Text style={styles.histMonth}>{m.label}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.histAmount, { color: isPositive ? COLORS.accent : COLORS.red }]}>
                    {isPositive ? '+' : ''}{fmt(m.saved)}
                  </Text>
                  {m.goal > 0 && (
                    <Text style={styles.histPct}>{fmtPct(Math.max(0, pct))} {t('ofGoal')}</Text>
                  )}
                </View>
              </View>
              {m.goal > 0 && (
                <View style={styles.barBg}>
                  <View style={[styles.barFill, {
                    width: Math.max(0, pct) + '%',
                    backgroundColor: pct >= 100 ? COLORS.accent : pct >= 60 ? '#ffe66d' : COLORS.red
                  }]} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    )}

    {/* INVERTIR */}
    {activeTab === 'invest' && (
      <>
        <View style={styles.investHeader}>
          <Text style={styles.cardLabel}>{t('investTitle')}</Text>
          <Text style={styles.investSubtitle}>
            {t('investSubtitle')}{fmt(capital)}{monthSaved > 0 ? t('monthSavings') : t('goalAmount')}
          </Text>
          {loadingRates ? (
            <View style={styles.ratesRow}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.ratesLoadingText}>{t('updatingRates')}</Text>
            </View>
          ) : ratesError ? (
            <View style={styles.ratesErrorBox}>
              <Text style={styles.ratesErrorText}>{t('noConnection')}</Text>
            </View>
          ) : lastUpdated ? (
            <View style={styles.ratesRow}>
              <Text style={{ fontSize: 10 }}>🟢</Text>
              <Text style={styles.ratesOkText}>
                {t('updatedAt')}{lastUpdated.getHours()}:{String(lastUpdated.getMinutes()).padStart(2, '0')}
              </Text>
            </View>
          ) : null}
        </View>

        {loadingRates ? (
          <View style={[styles.center, { paddingVertical: 40 }]}>
            <ActivityIndicator color={COLORS.accent} size="large" />
          </View>
        ) : (
          investments.map((inv, i) => {
            const ret = inv.type === 'ARS' && inv.tna > 0 ? calcReturn(inv.tna) : null;
            return (
              <View key={i} style={[styles.investCard, { borderColor: inv.color + '44' }]}>
                <View style={styles.investTop}>
                  <Text style={styles.investIcon}>{inv.icon}</Text>
                  <View style={styles.investInfo}>
                    <View style={styles.investNameRow}>
                      <Text style={styles.investName}>{inv.name}</Text>
                      {inv.live && (
                        <View style={styles.liveBadge}>
                          <Text style={styles.liveBadgeText}>🔴 LIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.investDesc}>{inv.desc}</Text>
                  </View>
                  {inv.type === 'ARS' && inv.tna > 0 && (
                    <Text style={[styles.investTNA, { color: inv.color }]}>{inv.tna}%</Text>
                  )}
                </View>
                {ret && (
                  <View style={styles.investReturns}>
                    <View style={styles.investReturn}>
                      <Text style={styles.investReturnLabel}>{t('monthlyReturn')}</Text>
                      <Text style={[styles.investReturnVal, { color: inv.color }]}>{fmt(ret.monthly)}</Text>
                    </View>
                    <View style={styles.investReturn}>
                      <Text style={styles.investReturnLabel}>{t('yearlyReturn')}</Text>
                      <Text style={[styles.investReturnVal, { color: inv.color }]}>{fmt(ret.yearly)}</Text>
                    </View>
                  </View>
                )}
                {inv.type === 'USD' && dolar && capital > 0 && (
                  <View style={styles.investReturns}>
                    <View style={styles.investReturn}>
                      <Text style={styles.investReturnLabel}>{t('usdEquiv')}</Text>
                      <Text style={[styles.investReturnVal, { color: inv.color }]}>
                        {fmtUSD(capital / dolar.venta)}
                      </Text>
                    </View>
                    <View style={styles.investReturn}>
                      <Text style={styles.investReturnLabel}>{t('salePriceLabel')}</Text>
                      <Text style={[styles.investReturnVal, { color: inv.color }]}>{'$' + dolar.venta}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{t('disclaimer')}</Text>
        </View>
      </>
    )}

    {/* CONSEJOS */}
    {activeTab === 'tips' && (
      <View>
        <Text style={[styles.cardLabel, { marginBottom: 16 }]}>{t('tipsTitle')}</Text>
        {TIPS.map((tip, i) => (
          <View key={i} style={styles.tipItem}>
            <Text style={styles.tipItemIcon}>{tip.icon}</Text>
            <Text style={styles.tipItemText}>{tip.tip}</Text>
          </View>
        ))}
        <View style={styles.ruleCard}>
          <Text style={styles.ruleTitle}>{t('ruleTitle')}</Text>
          <Text style={styles.ruleDesc}>{t('ruleDesc')}</Text>
          {monthIncome > 0 ? (
            [
              { label: t('ruleNeeds'), pct: 50, color: COLORS.accent, desc: t('ruleNeedsDesc') },
              { label: t('ruleWants'), pct: 30, color: COLORS.accent2, desc: t('ruleWantsDesc') },
              { label: t('ruleSavings'), pct: 20, color: '#ffe66d', desc: t('ruleSavingsDesc') },
            ].map((item, i) => (
              <View key={i} style={styles.ruleItem}>
                <View style={styles.ruleItemHeader}>
                  <Text style={[styles.ruleItemLabel, { color: item.color }]}>{item.label}</Text>
                  <Text style={[styles.ruleItemAmount, { color: item.color }]}>
                    {fmt(monthIncome * item.pct / 100)}
                  </Text>
                </View>
                <Text style={styles.ruleItemDesc}>{item.desc}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.ruleNoIncome}>{t('noIncome')}</Text>
          )}
        </View>
      </View>
    )}

    <View style={{ height: 80 }} />
  </ScrollView>

  <Modal visible={showGoalModal} transparent animationType="slide" onRequestClose={() => setShowGoalModal(false)}>
    <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowGoalModal(false)} />
      <View style={styles.modalBox}>
        <Text style={styles.modalTitle}>{t('goalModalTitle')}</Text>
        <Text style={styles.modalDesc}>{t('goalModalDesc')}</Text>
        <TextInput
          style={styles.modalInput}
          value={goalInput}
          onChangeText={setGoalInput}
          placeholder="Ej: 50000"
          placeholderTextColor={COLORS.muted}
          keyboardType="numeric"
          autoFocus
        />
        <TouchableOpacity style={styles.modalBtn} onPress={saveGoal}>
          <Text style={styles.modalBtnText}>{t('goalModalBtn')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </Modal>
</View>


);
}

const styles = StyleSheet.create({
container: { flex: 1, padding: 20 },
center: { alignItems: 'center', justifyContent: 'center' },
tabs: { flexDirection: 'row', backgroundColor: '#1a1a24', borderRadius: 14, padding: 4, marginBottom: 20, gap: 3 },
tab: { flex: 1, paddingVertical: 7, borderRadius: 10, alignItems: 'center' },
tabActive: { backgroundColor: COLORS.accent2 },
tabText: { fontSize: 10, color: COLORS.muted, fontWeight: '600' },
tabTextActive: { color: '#fff' },
card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
cardLabel: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
goalCard: { backgroundColor: '#16213e', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(124,92,255,0.3)', marginBottom: 14 },
goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
goalAmount: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginTop: 4 },
editGoalBtn: { backgroundColor: 'rgba(124,92,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
editGoalText: { fontSize: 13, color: COLORS.accent2, fontWeight: '600' },
barBg: { backgroundColor: COLORS.card2, borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 8 },
barFill: { height: 8, borderRadius: 6 },
progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
progressText: { fontSize: 12, color: COLORS.muted },
statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 12, marginTop: 12 },
statusText: { flex: 1, fontSize: 13, fontWeight: '500' },
projAmount: { fontSize: 26, fontWeight: '900', marginBottom: 6 },
projDesc: { fontSize: 13, color: COLORS.muted, marginBottom: 14, lineHeight: 18 },
projStats: { flexDirection: 'row', justifyContent: 'space-between' },
projStat: { alignItems: 'center' },
projStatLabel: { fontSize: 11, color: COLORS.muted, marginBottom: 4 },
projStatVal: { fontSize: 14, fontWeight: '700', color: COLORS.text },
tipCard: { backgroundColor: 'rgba(124,92,255,0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(124,92,255,0.3)', marginBottom: 14, alignItems: 'center' },
tipTitle: { fontSize: 13, fontWeight: '700', color: COLORS.accent2, marginBottom: 10 },
tipIconText: { fontSize: 36, marginBottom: 8 },
tipText: { fontSize: 14, color: COLORS.text, textAlign: 'center', lineHeight: 20 },
histItem: { marginBottom: 16 },
histHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
histMonth: { fontSize: 14, fontWeight: '600', color: COLORS.text },
histAmount: { fontSize: 15, fontWeight: '700' },
histPct: { fontSize: 11, color: COLORS.muted },
investHeader: { marginBottom: 14 },
investSubtitle: { fontSize: 13, color: COLORS.text, marginTop: 4, marginBottom: 8 },
ratesRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
ratesLoadingText: { fontSize: 12, color: COLORS.muted },
ratesErrorBox: { backgroundColor: 'rgba(255,179,71,0.1)', borderRadius: 8, padding: 8 },
ratesErrorText: { fontSize: 12, color: '#ffb347' },
ratesOkText: { fontSize: 11, color: COLORS.muted },
investCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 10 },
investTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
investIcon: { fontSize: 28 },
investInfo: { flex: 1 },
investNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
investName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
liveBadge: { backgroundColor: 'rgba(255,77,109,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
liveBadgeText: { fontSize: 9, color: COLORS.red, fontWeight: '700' },
investDesc: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
investTNA: { fontSize: 16, fontWeight: '900' },
investReturns: { flexDirection: 'row', gap: 10 },
investReturn: { flex: 1, backgroundColor: COLORS.card2, borderRadius: 10, padding: 10 },
investReturnLabel: { fontSize: 10, color: COLORS.muted, marginBottom: 4 },
investReturnVal: { fontSize: 15, fontWeight: '800' },
disclaimer: { backgroundColor: 'rgba(255,179,71,0.1)', borderRadius: 12, padding: 14, marginTop: 4, marginBottom: 14 },
disclaimerText: { fontSize: 12, color: '#ffb347', lineHeight: 18 },
tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
tipItemIcon: { fontSize: 24 },
tipItemText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 20 },
ruleCard: { backgroundColor: '#16213e', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(124,92,255,0.3)', marginTop: 8 },
ruleTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
ruleDesc: { fontSize: 12, color: COLORS.muted, marginBottom: 14 },
ruleItem: { marginBottom: 12 },
ruleItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
ruleItemLabel: { fontSize: 13, fontWeight: '700' },
ruleItemAmount: { fontSize: 13, fontWeight: '700' },
ruleItemDesc: { fontSize: 11, color: COLORS.muted },
ruleNoIncome: { fontSize: 13, color: COLORS.muted, textAlign: 'center', paddingVertical: 10 },
modalOverlay: { flex: 1, justifyContent: 'flex-end' },
modalBox: { backgroundColor: COLORS.card, borderRadius: 28, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: COLORS.border },
modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
modalDesc: { fontSize: 14, color: COLORS.muted, marginBottom: 16 },
modalInput: { backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
modalBtn: { backgroundColor: COLORS.accent, borderRadius: 14, padding: 14, alignItems: 'center' },
modalBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
});