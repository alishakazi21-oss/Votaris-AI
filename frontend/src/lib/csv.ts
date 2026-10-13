// Client-side CSV export utility

export function exportToCSV<T extends Record<string, unknown>>(
  filename: string,
  data: T[],
  headers?: { key: keyof T; label: string }[]
): void {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  let keys: (keyof T)[];
  let headerRow: string[];

  if (headers && headers.length > 0) {
    keys = headers.map(h => h.key);
    headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`);
  } else {
    keys = Object.keys(data[0]) as (keyof T)[];
    headerRow = keys.map(k => `"${String(k).replace(/"/g, '""')}"`);
  }

  const rows = data.map(row => {
    return keys
      .map(k => {
        const val = row[k];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  const csvContent = [headerRow.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
