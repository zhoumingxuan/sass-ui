'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Pagination from './Pagination';

export type Column<T> = {
  key: keyof T;
  title: ReactNode;
  align?: 'left' | 'right';
  minWidth?: number;
  width?: number | string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  tooltip?: (row: T) => string;
};

type Density = 'compact' | 'cozy' | 'comfortable';

export default function Table<T extends Record<string, unknown>>({
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
  loading = false,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
  stickyHeader = true,
  toolbar,
  rounded = 'xl',
  showDensity = true,
  searchPlaceholder = '搜索',
  highlightOnHover = true,
  zebra = true,
  rowKey,
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
  loading?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (n: number) => void;
  stickyHeader?: boolean;
  toolbar?: ReactNode;
  rounded?: 'md' | 'lg' | 'xl' | '2xl';
  showDensity?: boolean;
  searchPlaceholder?: string;
  highlightOnHover?: boolean;
  zebra?: boolean;
  rowKey?: (row: T, index: number) => string | number;
}) {
  const [density, setDensity] = useState<Density>('cozy');
  const [keyword, setKeyword] = useState('');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!onSearch) return;
    const id = setTimeout(() => onSearch(keyword.trim()), 300);
    return () => clearTimeout(id);
  }, [keyword, onSearch]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 0);
    handler();
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const sizeClass = useMemo(() => {
    // 行高：紧凑 40 / 适中 48 / 宽松 56，符合后台可读性
    switch (density) {
      case 'compact':
        return { tr: 'h-10', cell: 'px-4 py-2 text-xs', th: 'px-4 py-2 text-xs' };
      case 'comfortable':
        return { tr: 'h-14', cell: 'px-5 py-3 text-sm', th: 'px-5 py-3 text-xs' };
      default:
        return { tr: 'h-12', cell: 'px-4 py-2.5 text-sm', th: 'px-4 py-2.5 text-xs' };
    }
  }, [density]);

  const roundedClass =
    rounded === '2xl' ? 'rounded-2xl' : rounded === 'lg' ? 'rounded-lg' : rounded === 'md' ? 'rounded-md' : 'rounded-xl';

  return (
    <div
      className={card ? `overflow-hidden ${roundedClass} border border-gray-200 bg-white shadow-sm` : ''}
      role="region"
      aria-label={typeof title === 'string' ? title : '表格'}
    >
      {(title || onSearch || toolbar) && (
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900">
              {title}
              {typeof total === 'number' && title ? (
                <span className="ml-1 text-gray-500"> · {total} 条</span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSearch && (
              <div className="relative">
                <svg
                  aria-hidden
                  className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM8 14a6 6 0 100-12 6 6 0 000 12z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  aria-label="搜索"
                  className="h-9 w-56 rounded-md border border-gray-300 pl-7 pr-8 text-sm outline-none transition-[box-shadow,border-color] focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder={searchPlaceholder}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                {keyword && (
                  <button
                    aria-label="清除"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded hover:bg-gray-100 active:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    onClick={() => setKeyword('')}
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4 text-gray-400" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 10-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {showDensity && (
              <div className="inline-flex overflow-hidden rounded-md border border-gray-300 text-sm">
                {(['compact', 'cozy', 'comfortable'] as Density[]).map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    className={`h-9 px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
                      density === d ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'
                    } ${i !== 0 ? 'border-l border-gray-300' : ''}`}
                    onClick={() => setDensity(d)}
                  >
                    {d === 'compact' ? '紧凑' : d === 'comfortable' ? '宽松' : '适中'}
                  </button>
                ))}
              </div>
            )}

            {toolbar}
          </div>
        </div>
      )}

      <div ref={scrollerRef} className="relative overflow-auto">
        <table className="w-full border-collapse">
          <thead
            className={[
              stickyHeader ? 'sticky top-0 z-10' : '',
              'bg-gray-50 text-gray-700',
              'border-b border-gray-200',
              scrolled ? 'shadow-sm' : '',
            ].join(' ')}
          >
            <tr>
              {columns.map((col) => {
                const sortable = !!col.sortable;
                const active = sortable && sortKey === col.key;
                const ariaSort = sortable
                  ? active
                    ? (sortDirection === 'asc' ? 'ascending' : 'descending')
                    : 'none'
                  : undefined;

                return (
                  <th
                    key={String(col.key)}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`${sizeClass.th} h-12 font-medium text-gray-700 ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                    style={{ minWidth: col.minWidth, width: col.width }}
                  >
                    <button
                      type="button"
                      className={`group flex w-full items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
                        col.align === 'right' ? 'justify-end' : 'justify-start'
                      }`}
                      onClick={() => sortable && onSort?.(col.key)}
                    >
                      <span className="truncate">{col.title}</span>
                      {sortable && (
                        <svg
                          viewBox="0 0 16 16"
                          className={`h-3.5 w-3.5 text-gray-400 group-hover:text-gray-500 ${
                            active ? '' : 'opacity-70'
                          }`}
                          fill="currentColor"
                          aria-hidden
                        >
                          {active ? (
                            sortDirection === 'asc' ? (
                              <path d="M8 3l4 5H4l4-5z" />
                            ) : (
                              <path d="M8 13l-4-5h8l-4 5z" />
                            )
                          ) : (
                            <path d="M8 4l3.5 4.5h-7L8 4zm0 8l-3.5-4.5h7L8 12z" />
                          )}
                        </svg>
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                <tr key={`sk-${i}`} className={sizeClass.tr}>
                  {columns.map((_, j) => (
                    <td key={j} className={sizeClass.cell}>
                      <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((row, idx) => {
                const key = rowKey ? rowKey(row, idx) : idx;
                return (
                  <tr
                    key={key}
                    className={[
                      zebra ? 'odd:bg-white even:bg-gray-50/60' : 'bg-white',
                      highlightOnHover ? 'hover:bg-gray-50' : '',
                      'transition-colors',
                      sizeClass.tr,
                    ].join(' ')}
                  >
                    {columns.map((col) => {
                      const value = col.render ? col.render(row) : (row[col.key] as ReactNode);
                      const title = col.tooltip ? col.tooltip(row) : (typeof value === 'string' ? value : undefined);
                      return (
                        <td
                          key={String(col.key)}
                          className={[
                            sizeClass.cell,
                            col.align === 'right' ? 'text-right tabular-nums' : 'text-left',
                            'text-gray-900',
                          ].join(' ')}
                          style={{ minWidth: col.minWidth, width: col.width }}
                          title={title as string | undefined}
                        >
                          <div className="truncate">{value}</div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-400" fill="currentColor">
                      <path d="M10 2a8 8 0 105.293 14.293l3.707 3.707a1 1 0 001.414-1.414l-3.707-3.707A8 8 0 0010 2zm-6 8a6 6 0 1112 0A6 6 0 014 10z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">暂无数据</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <span>共 {total} 条</span>
          {onPageSizeChange && (
            <>
              <span className="hidden sm:inline">· 每页</span>
              <select
                aria-label="每页条数"
                className="h-8 rounded-md border border-gray-300 px-2 outline-none transition-[box-shadow,border-color] focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(parseInt(e.target.value, 10))}
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span className="hidden sm:inline">条</span>
            </>
          )}
        </div>

        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
      </div>
    </div>
  );
}
