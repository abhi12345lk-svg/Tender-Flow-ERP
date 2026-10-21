import React from 'react';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import { Loader2 } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display matching the current criteria.',
  emptyActionLabel,
  onEmptyAction,
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = '',
}) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col ${className}`}>
      {/* Mobile scroll hint banner for touch screens */}
      {data.length > 0 && (
        <div className="sm:hidden px-3 py-1.5 bg-slate-50 border-b border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between select-none">
          <span>Swipe horizontally for details & actions</span>
          <span className="font-semibold text-blue-600 font-mono text-[10px]">Scroll &rarr;</span>
        </div>
      )}
      <div className="overflow-x-auto min-h-[200px] scrollbar-thin scrollbar-thumb-slate-300 -webkit-overflow-scrolling-touch">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider select-none">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={`${col.key || 'col'}-${idx}`}
                  scope="col"
                  className={`px-3 sm:px-4 py-3 whitespace-nowrap text-[11px] sm:text-xs ${col.headerClassName || ''} ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/80 bg-white">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-slate-500">
                  <div className="inline-flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-xs font-medium text-slate-600">Loading government records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="hover:bg-slate-50/80 transition-colors duration-75 even:bg-slate-50/30"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={`${col.key || 'col'}-${colIdx}`}
                      className={`px-3 sm:px-4 py-2.5 whitespace-nowrap text-slate-700 text-xs ${col.cellClassName || ''} ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {currentPage && totalItems !== undefined && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
