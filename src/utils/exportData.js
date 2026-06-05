import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Escapa un valor para CSV (entre comillas si contiene comas, comillas o saltos)
const escapeCSV = (val) => {
  const str = String(val ?? '');
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
};

/**
 * Genera un CSV con las transacciones y lo comparte.
 * @param {Array}  transactions  - Array de transacciones del hook useFirestore
 * @param {Object} catLabels     - t('cats') — mapa de key a nombre traducido
 * @returns {boolean} true si se exportó, false si no había datos
 */
export const exportTransactionsToCSV = async (transactions, catLabels) => {
  if (!transactions?.length) return false;

  // BOM UTF-8 para que Excel y Google Sheets abran el CSV con acentos correctamente
  const BOM = '﻿';

  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount (ARS)'];

  const rows = transactions.map(tx => {
    const d = new Date(tx.date);
    const date = [
      d.getDate().toString().padStart(2, '0'),
      (d.getMonth() + 1).toString().padStart(2, '0'),
      d.getFullYear(),
    ].join('/');

    return [
      date,
      tx.desc || '',
      catLabels[tx.category] || tx.category,
      tx.type === 'income' ? 'Income' : 'Expense',
      tx.amount,
    ].map(escapeCSV).join(',');
  });

  const csv = BOM + [headers.join(','), ...rows].join('\n');

  const today = new Date().toISOString().split('T')[0];
  const filename = `FlowCash_${today}.csv`;

  if (Platform.OS === 'web') {
    // En web: descarga directa via blob URL
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // En móvil: expo-file-system + expo-sharing
    const path = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(path, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(path, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar movimientos FlowCash',
      UTI: 'public.comma-separated-values-text',
    });
  }

  return true;
};
