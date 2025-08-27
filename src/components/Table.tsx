'use client';

import { ReactNode, useState } from 'react';
import Pagination from './Pagination';

export type Column<T> = {
  key: keyof T;
  title: ReactNode;
  align?: 'left' | 'right';
  minWidth?: number;
  sortable?: boolean;
};

export default function Table<T extends Record<string, ReactNode>>({
  columns,
  data,
  page,
  pageSize,
  total,
  onPageChange,
  title,
  onSearch,
  sortKey,
  sortDirection,
  onSort,
  card = true,
}: {
  columns: Column<T>[];
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  title?: string;
  onSearch?: (v: string) => void;
  sortKey?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: keyof T) => void;
  card?: boolean;
}) {
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  const trHeight = density === 'comfortable' ? 'h-12' : 'h-11';
  const cellPadding = density === 'comfortable' ? 'px-4 py-2' : 'px-3 py-2';

  return (
    <div
      className={
        card
          ? 'overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm'
          : ''
      }
    >
      {(title || onSearch) && (
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div className="font-medium text-gray-700">
            {title}
            {typeof total === 'number' && title ? ` · ${total} 条` : ''}
          </div>
          <div className="flex items-center gap-2">
            {onSearch && (
              <input
                aria-label="搜索"
                className="h-9 w-40 rounded border border-gray-300 px-2 text-sm"
                placeholder="搜索"
                onChange={(e) => onSearch(e.target.value)}
              />
            )}
            <button
              className="h-9 rounded border border-gray-300 px-2 text-sm"
              onClick={() =>
                setDensity((d) => (d === 'comfortable' ? 'compact' : 'comfortable'))
              }
            >
              {density === 'comfortable' ? '紧凑' : '舒适'}
            </button>
          </div>
        </div>
      )}
      <div className="overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-2 font-medium ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                  style={{ minWidth: col.minWidth }}
                  scope="col"
                  {...(col.sortable
                    ? { 'aria-sort': sortKey === col.key ? sortDirection : 'none' }
                    : {})}
                >
                  <button
                    className="flex w-full items-center justify-between gap-1"
                    onClick={() => col.sortable && onSort?.(col.key)}
                  >
                    <span>{col.title}</span>
                    {col.sortable && (
                      <span className="text-xs">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            '▲'
                          ) : (
                            '▼'
                          )
                        ) : (
                          '↕'
                        )}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  className={`odd:bg-white even:bg-gray-50 hover:bg-primary/5 ${trHeight}`}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`${cellPadding} ${
                        col.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                      }`}
                      style={{ minWidth: col.minWidth }}
                    >
                      <div className="truncate" title={String(row[col.key])}>
                        {row[col.key] as ReactNode}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-gray-400"
                >
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-600">
        <span>
          共 {total} 条 · 每页 {pageSize} 条
        </span>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
