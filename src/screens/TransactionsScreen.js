import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { COLORS, CAT_EMOJIS, CAT_COLORS } from '../constants';
import { useLang } from '../hooks/useLang';
import AddTransactionModal from '../components/AddTransactionModal';

const fmt = (n) => '$' + Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });

export default function TransactionsScreen({ transactions, onDelete, onEdit, hasMore, onLoadMore, bottomOffset = 80 }) {
  const { t } = useLang();
  const [editingTx, setEditingTx] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(tx =>
      tx.desc?.toLowerCase().includes(q) ||
      (t('cats')[tx.category] || '').toLowerCase().includes(q)
    );
  }, [transactions, search]);

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

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await onLoadMore?.();
    setLoadingMore(false);
  };

  const renderItem = ({ item: tx }) => {
    const d = new Date(tx.date);
    return (
      <View style={styles.txItem}>
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
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filtered}
        keyExtractor={tx => tx.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionTitle}>{t('transactions')}</Text>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder={t('searchPlaceholder')}
                placeholderTextColor={COLORS.muted}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyText}>{search ? t('noResults') : t('noTx')}</Text>
          </View>
        }
        ListFooterComponent={
          <View>
            {hasMore && (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} disabled={loadingMore}>
                {loadingMore
                  ? <ActivityIndicator color={COLORS.accent} size="small" />
                  : <Text style={styles.loadMoreText}>↓ {t('loadMore')}</Text>
                }
              </TouchableOpacity>
            )}
            <View style={{ height: bottomOffset + 20 }} />
          </View>
        }
      />

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
  container: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 14, gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  searchClear: { fontSize: 14, color: COLORS.muted, padding: 4 },
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
  loadMoreBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, marginBottom: 10,
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
});
