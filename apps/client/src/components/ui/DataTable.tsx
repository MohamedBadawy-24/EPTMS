import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  rowHighlight?: (row: T) => 'red' | 'amber' | 'green' | null;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No records found.',
  pageSize = 10,
  rowHighlight,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else if (valA instanceof Date && valB instanceof Date) {
        comparison = valA.getTime() - valB.getTime();
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getRowHighlightClass = (row: T) => {
    if (!rowHighlight) return '';
    const highlight = rowHighlight(row);
    if (highlight === 'red') return 'bg-rose-50/60 hover:bg-rose-50 border-l-4 border-l-rose-500';
    if (highlight === 'amber') return 'bg-amber-50/60 hover:bg-amber-50 border-l-4 border-l-amber-500';
    if (highlight === 'green') return 'bg-emerald-50/40 hover:bg-emerald-50/70 border-l-4 border-l-emerald-500';
    return '';
  };

  return (
    <div className={cn('flex flex-col w-full bg-white rounded-lg border border-scb-warm/80 overflow-hidden shadow-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-scb-offwhite/80 border-b border-scb-warm/70 text-scb-dark font-semibold">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'py-3 px-4 select-none tracking-wider text-[11px] uppercase text-scb-dark-muted',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sortable && 'cursor-pointer hover:bg-scb-warm/40 transition-colors',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={cn('inline-flex items-center gap-1.5', col.align === 'right' && 'justify-end')}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-scb-dark-muted">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-scb-blue stroke-[2.5]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-scb-blue stroke-[2.5]" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-scb-warm/40">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-scb-dark-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-scb-blue border-t-transparent rounded-full animate-spin" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-scb-dark-muted font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={keyExtractor(row, index)}
                  className={cn(
                    'transition-colors duration-100 group',
                    onRowClick ? 'cursor-pointer hover:bg-scb-offwhite/80' : 'hover:bg-scb-offwhite/50',
                    getRowHighlightClass(row)
                  )}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'py-3 px-4 text-scb-dark font-normal align-middle',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {col.render ? col.render(row, index) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && data.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 bg-scb-offwhite/50 border-t border-scb-warm/60 text-xs text-scb-dark-muted">
          <div>
            Showing <span className="font-semibold text-scb-dark">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-scb-dark">{Math.min(currentPage * pageSize, data.length)}</span> of{' '}
            <span className="font-semibold text-scb-dark">{data.length}</span> results
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="px-2 font-medium text-scb-dark">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
