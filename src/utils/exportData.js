import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const escapeHTML = (str) =>
  String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/**
 * Exporta transacciones como archivo .xls (tabla HTML con estilos).
 * Excel y Google Sheets abren .xls directamente con el color de encabezado.
 * @param {Array}  transactions  - Array de transacciones
 * @param {Object} catLabels     - t('cats') — categorías traducidas
 */
export const exportTransactionsToXLS = async (transactions, catLabels) => {
  if (!transactions?.length) return false;

  const HEADER_STYLE = [
    'background-color:#b3d9ff',
    'color:#003366',
    'font-weight:bold',
    'font-family:Arial,sans-serif',
    'font-size:12px',
    'padding:8px 12px',
    'border:1px solid #6699cc',
    'text-align:left',
  ].join(';');

  const CELL_STYLE = [
    'font-family:Arial,sans-serif',
    'font-size:12px',
    'padding:6px 12px',
    'border:1px solid #ddd',
  ].join(';');

  const ROW_ODD_BG  = 'background-color:#ffffff';
  const ROW_EVEN_BG = 'background-color:#f0f7ff';

  const INCOME_STYLE  = CELL_STYLE + ';color:#007a3d;font-weight:600';
  const EXPENSE_STYLE = CELL_STYLE + ';color:#cc0000;font-weight:600';

  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount (ARS)'];
  const headerRow = headers
    .map(h => `<th style="${HEADER_STYLE}">${escapeHTML(h)}</th>`)
    .join('');

  const dataRows = transactions.map((tx, i) => {
    const d = new Date(tx.date);
    const date = [
      d.getDate().toString().padStart(2, '0'),
      (d.getMonth() + 1).toString().padStart(2, '0'),
      d.getFullYear(),
    ].join('/');

    const rowBg = i % 2 === 0 ? ROW_ODD_BG : ROW_EVEN_BG;
    const isIncome = tx.type === 'income';
    const typeLabel = isIncome ? 'Income' : 'Expense';
    const typeStyle = isIncome ? INCOME_STYLE : EXPENSE_STYLE;
    const amtStyle  = isIncome ? INCOME_STYLE : EXPENSE_STYLE;

    const cells = [
      `<td style="${CELL_STYLE};${rowBg}">${escapeHTML(date)}</td>`,
      `<td style="${CELL_STYLE};${rowBg}">${escapeHTML(tx.desc || '')}</td>`,
      `<td style="${CELL_STYLE};${rowBg}">${escapeHTML(catLabels[tx.category] || tx.category)}</td>`,
      `<td style="${typeStyle};${rowBg}">${escapeHTML(typeLabel)}</td>`,
      `<td style="${amtStyle};${rowBg};text-align:right">${escapeHTML(String(tx.amount))}</td>`,
    ].join('');

    return `<tr>${cells}</tr>`;
  }).join('\n');

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <!--[if gte mso 9]>
  <xml><x:ExcelWorkbook><x:ExcelWorksheets>
    <x:ExcelWorksheet><x:Name>FlowCash</x:Name>
      <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
    </x:ExcelWorksheet>
  </x:ExcelWorksheets></x:ExcelWorkbook></xml>
  <![endif]-->
</head>
<body>
<table style="border-collapse:collapse">
  <thead><tr>${headerRow}</tr></thead>
  <tbody>${dataRows}</tbody>
</table>
</body>
</html>`.trim();

  const today = new Date().toISOString().split('T')[0];
  const filename = `FlowCash_${today}.xls`;

  if (Platform.OS === 'web') {
    // Web: descarga directa
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Móvil: expo-file-system + expo-sharing
    const path = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(path, html, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(path, {
      mimeType: 'application/vnd.ms-excel',
      dialogTitle: 'Exportar FlowCash',
      UTI: 'com.microsoft.excel.xls',
    });
  }

  return true;
};
