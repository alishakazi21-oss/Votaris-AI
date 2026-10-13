import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToCSV } from '../../lib/csv';
import { twMerge } from 'tailwind-merge';

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchPlaceholder?: string;
  exportFilename?: string;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 8,
  searchPlaceholder = 'Search records...',
  exportFilename = 'voltaris_data_export',
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const query = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? '').toLowerCase().includes(query)
      )
    );
  }, [data, searchTerm]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortKey, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleExport = () => {
    exportToCSV(
      exportFilename,
      sortedData,
      columns.map((c) => ({ key: c.key, label: c.label }))
    );
  };

  return (
    <div className={twMerge('space-y-3', className)}>
      {/* Table controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-base border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-primary focus:border-accent-cyan focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-elevated hover:border-accent-cyan/50 text-xs font-medium text-secondary hover:text-primary transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-elevated border-b border-border z-10 text-secondary uppercase tracking-wider text-[11px]">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="p-3 font-semibold whitespace-nowrap"
                  >
                    {col.sortable !== false ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors focus:outline-none"
                      >
                        <span>{col.label}</span>
                        <ArrowUpDown className="w-3 h-3 text-muted" />
                      </button>
                    ) : (
                      <span>{col.label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="hover:bg-elevated/40 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={String(col.key)} className="p-3 text-primary whitespace-nowrap font-mono text-[11px]">
                        {col.render ? col.render(row) : String(row[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center text-muted"
                  >
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface text-xs text-secondary">
          <span>
            Showing <strong className="text-primary font-mono">{sortedData.length ? (currentPage - 1) * pageSize + 1 : 0}</strong> -{' '}
            <strong className="text-primary font-mono">{Math.min(currentPage * pageSize, sortedData.length)}</strong> of{' '}
            <strong className="text-primary font-mono">{sortedData.length}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded border border-border hover:bg-elevated disabled:opacity-40 disabled:pointer-events-none text-primary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded border border-border hover:bg-elevated disabled:opacity-40 disabled:pointer-events-none text-primary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
