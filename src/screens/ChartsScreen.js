import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { COLORS, CAT_COLORS, CATEGORIES } from '../constants';
import { useLang } from '../hooks/useLang';
const fmt = (n) => '$' + Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });

export default function ChartsScreen({ transactions, bottomOffset = 80 }) {
const { t } = useLang();
const { width: SCREEN_WIDTH } = useWindowDimensions();
const [activeChart, setActiveChart] = useState('line');
const now = new Date();

const months = [];
for (let i = 5; i >= 0; i--) {
const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
months.push({ month: d.getMonth(), year: d.getFullYear(), label: t('months')[d.getMonth()] });
}

const monthlyData = months.map(({ month, year }) => {
const txs = transactions.filter(tx => {
const d = new Date(tx.date);
return d.getMonth() === month && d.getFullYear() === year;
});
const income = txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
const expense = txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
return { income, expense };
});

const labels = months.map(m => m.label);
const incomeData = monthlyData.map(m => m.income);
const expenseData = monthlyData.map(m => m.expense);

const monthTx = transactions.filter(tx => {
const d = new Date(tx.date);
return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && tx.type === 'expense';
});

const catTotals = {};
monthTx.forEach(tx => { catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount; });

const pieData = CATEGORIES
.filter(cat => cat !== 'Salary' && catTotals[cat] > 0)
.map(cat => ({
name: t('cats')[cat],
amount: catTotals[cat],
color: CAT_COLORS[cat],
legendFontColor: COLORS.muted,
legendFontSize: 12,
}));

const totalExpense = monthTx.reduce((s, tx) => s + tx.amount, 0);

const chartConfig = {
backgroundColor: COLORS.card,
backgroundGradientFrom: COLORS.card,
backgroundGradientTo: COLORS.card,
decimalPlaces: 0,
color: (opacity = 1) => `rgba(0, 229, 160, ${opacity})`,
labelColor: () => COLORS.muted,
style: { borderRadius: 16 },
propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.accent },
};

const hasData = transactions.length > 0;

return (
<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
<View style={styles.toggle}>
<TouchableOpacity
style={[styles.toggleBtn, activeChart === 'line' && styles.toggleBtnActive]}
onPress={() => setActiveChart('line')}>
<Text style={[styles.toggleText, activeChart === 'line' && styles.toggleTextActive]}>{t('evolution')}</Text>
</TouchableOpacity>
<TouchableOpacity
style={[styles.toggleBtn, activeChart === 'bar' && styles.toggleBtnActive]}
onPress={() => setActiveChart('bar')}>
<Text style={[styles.toggleText, activeChart === 'bar' && styles.toggleTextActive]}>{t('compare')}</Text>
</TouchableOpacity>
<TouchableOpacity
style={[styles.toggleBtn, activeChart === 'pie' && styles.toggleBtnActive]}
onPress={() => setActiveChart('pie')}>
<Text style={[styles.toggleText, activeChart === 'pie' && styles.toggleTextActive]}>{t('categories')}</Text>
</TouchableOpacity>
</View>

  {!hasData ? (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyText}>{t('noData')}</Text>
    </View>
  ) : (
    <>
      {activeChart === 'line' && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('lineChartTitle')}</Text>
          <LineChart
            data={{
              labels,
              datasets: [
                { data: incomeData, color: () => COLORS.accent, strokeWidth: 2 },
                { data: expenseData, color: () => COLORS.red, strokeWidth: 2 },
              ],
              legend: [t('chartIncome'), t('chartExpenses')],
            }}
            width={SCREEN_WIDTH - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
              <Text style={styles.legendText}>{t('chartIncome')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.red }]} />
              <Text style={styles.legendText}>{t('chartExpenses')}</Text>
            </View>
          </View>
        </View>
      )}

      {activeChart === 'bar' && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('barChartTitle')}</Text>
          <BarChart
            data={{ labels, datasets: [{ data: expenseData }] }}
            width={SCREEN_WIDTH - 48}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(255, 77, 109, ${opacity})`,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
          />
          <View style={styles.summaryRow}>
            {monthlyData.slice(-3).map((m, i) => (
              <View key={i} style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{labels[labels.length - 3 + i]}</Text>
                <Text style={[styles.summaryInc, { color: COLORS.accent }]}>{fmt(m.income)}</Text>
                <Text style={[styles.summaryExp, { color: COLORS.red }]}>{fmt(m.expense)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {activeChart === 'pie' && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('pieChartTitle')} — {t('months')[now.getMonth()]}</Text>
          {pieData.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('noExpenses')}</Text>
            </View>
          ) : (
            <>
              <PieChart
                data={pieData}
                width={SCREEN_WIDTH - 48}
                height={200}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
              <View style={styles.catList}>
                {pieData.map((item, i) => (
                  <View key={i} style={styles.catRow}>
                    <View style={[styles.catDot, { backgroundColor: item.color }]} />
                    <Text style={styles.catName}>{item.name}</Text>
                    <Text style={styles.catAmt}>{fmt(item.amount)}</Text>
                    <Text style={styles.catPct}>
                      {totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0}%
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      )}
    </>
  )}
  <View style={{ height: bottomOffset + 20 }} />
</ScrollView>


);
}

const styles = StyleSheet.create({
container: { flex: 1, padding: 20 },
toggle: {
flexDirection: 'row', backgroundColor: COLORS.card2,
borderRadius: 14, padding: 4, marginBottom: 20, gap: 4,
},
toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
toggleBtnActive: { backgroundColor: COLORS.accent2 },
toggleText: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },
toggleTextActive: { color: '#fff' },
chartCard: {
backgroundColor: COLORS.card, borderRadius: 20, padding: 16,
borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
},
chartTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
chart: { borderRadius: 12, marginLeft: -10 },
legend: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 12 },
legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
legendDot: { width: 10, height: 10, borderRadius: 5 },
legendText: { fontSize: 12, color: COLORS.muted },
summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
summaryItem: { alignItems: 'center' },
summaryLabel: { fontSize: 11, color: COLORS.muted, marginBottom: 4 },
summaryInc: { fontSize: 13, fontWeight: '700' },
summaryExp: { fontSize: 13, fontWeight: '700' },
catList: { marginTop: 12, gap: 8 },
catRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
catDot: { width: 10, height: 10, borderRadius: 5 },
catName: { flex: 1, fontSize: 13, color: COLORS.text },
catAmt: { fontSize: 13, fontWeight: '700', color: COLORS.text },
catPct: { fontSize: 12, color: COLORS.muted, width: 35, textAlign: 'right' },
empty: { alignItems: 'center', paddingVertical: 40 },
emptyIcon: { fontSize: 48, marginBottom: 12 },
emptyText: { color: COLORS.muted, textAlign: 'center', lineHeight: 22 },
});