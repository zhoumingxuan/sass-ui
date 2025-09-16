'use client';

import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Pagination from './Pagination';
import { controlRing } from './formStyles';

type SortDirection = 'asc' | 'desc';

export type CellRenderContext<T> = {
  row: T;
  rowIndex: number;
  key: string | number;
  isSelected: boolean;
  isFocused: boolean;
};

export type Column<T> = {
  key: keyof T | string;
  title: ReactNode;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  maxWidth?: number;
  width?: number | string;
  flex?: number;
  sortable?: boolean;
  sortKey?: keyof T;
  render?: (row: T, context: CellRenderContext<T>) => ReactNode;
  tooltip?: (row: T) => string;
  className?: string;
  headerClassName?: string;
  intent?: 'data' | 'actions' | 'status' | 'meta';
  hidden?: boolean;
};

type RowSelection<T> = {
  mode?: 'multiple' | 'single';
  selectedKeys: Array<string | number>;
  onChange: (keys: Array<string | number>, rows: T[]) => void;
  selectOnRowClick?: boolean;
  isRowSelectable?: (row: T, index: number) => boolean;
  columnWidth?: number;
  headerTitle?: string;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  title?: ReactNode;
  description?: ReactNode;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  sortKey?: Column<T>['key'];
  sortDirection?: SortDirection;
  onSort?: (key: Column<T>['key']) => void;
  card?: boolean;
  loading?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  stickyHeader?: boolean;
  toolbar?: ReactNode;
  highlightOnHover?: boolean;
  zebra?: boolean;
  rowKey?: (row: T, index: number) => string | number;
  selection?: RowSelection<T>;
  focusedRowKey?: string | number | null;
  defaultFocusedRow?: string | number | null;
  onFocusedRowChange?: (key: string | number | null, row: T | null) => void;
  emptyState?: ReactNode;
  footerExtra?: ReactNode;
  scrollContainerClassName?: string;
  className?: string;
  rounded?: 'md' | 'lg' | 'xl' | '2xl';
};

const checkboxClass = [
  'h-4 w-4 shrink-0 rounded border border-gray-200 bg-white',
  'hover:border-gray-300 hover:bg-gray-50 disabled:hover:border-gray-200 disabled:hover:bg-white',
  'accent-primary checked:border-primary/60 checked:hover:border-primary checked:hover:bg-primary/5 disabled:accent-gray-300',
  controlRing,
  'transition-[border-color,box-shadow,background-color]',
].join(' ');

const radioClass = [
  'h-4 w-4 shrink-0 rounded-full border border-gray-200 bg-white',
  'hover:border-gray-300 hover:bg-gray-50 disabled:hover:border-gray-200 disabled:hover:bg-white',
  'accent-primary disabled:accent-gray-300',
  controlRing,
  'transition-[border-color,box-shadow,background-color]',
].join(' ');

function useIndeterminate(checked: boolean, indeterminate?: boolean) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate) && !checked;
    }
  }, [checked, indeterminate]);
  return ref;
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  page,
  pageSize,
  total,
  onPageChange,
  title,
  description,
  onSearch,
  searchPlaceholder = '搜索',
  sortKey,
  sortDirection,
  onSort,
  card = true,
  loading = false,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
  stickyHeader = true,
  toolbar,
  highlightOnHover = true,
  zebra = true,
  rowKey,
  selection,
  focusedRowKey,
  defaultFocusedRow,
  onFocusedRowChange,
  emptyState,
  footerExtra,
  scrollContainerClassName = '',
  className = '',
  rounded = 'xl',
}: TableProps<T>) {
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
    const handleScroll = () => setScrolled(el.scrollTop > 0);
    handleScroll();
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const visibleColumns = useMemo(
    () => columns.filter((col) => !col.hidden),
    [columns],
  );

  const hasFlexibleColumn = useMemo(
    () => visibleColumns.some((col) => typeof col.width === 'undefined'),
    [visibleColumns],
  );

  const flexibleWeight = useMemo(() => {
    if (!hasFlexibleColumn) return 1;
    return visibleColumns.reduce((total, col) => {
      if (typeof col.width !== 'undefined') return total;
      return total + (col.flex ?? 1);
    }, 0) || 1;
  }, [visibleColumns, hasFlexibleColumn]);

  const columnStyles = useMemo(() => {
    return visibleColumns.map<CSSProperties>((col) => {
      const style: CSSProperties = {};
      if (typeof col.minWidth === 'number') {
        style.minWidth = `${col.minWidth}px`;
      }
      if (typeof col.maxWidth === 'number') {
        style.maxWidth = `${col.maxWidth}px`;
      }
      if (typeof col.width !== 'undefined') {
        style.width = typeof col.width === 'number' ? `${col.width}px` : col.width;
      } else if (hasFlexibleColumn) {
        const weight = col.flex ?? 1;
        const percent = Math.max((weight / flexibleWeight) * 100, 0);
        style.width = `${percent}%`;
      }
      return style;
    });
  }, [visibleColumns, hasFlexibleColumn, flexibleWeight]);

  const selectedKeysRef = selection?.selectedKeys;
  const selectedSet = useMemo(() => new Set<string | number>(selectedKeysRef ?? []), [selectedKeysRef]);
  const selectOnRowClick = selection?.selectOnRowClick ?? true;

  const rowItems = useMemo(() => {
    return data.map((row, index) => {
      const fallbackKey =
        (rowKey ? rowKey(row, index) : (row as { id?: string | number })?.id ?? (row as { key?: string | number })?.key) ??
        index;
      const key = fallbackKey as string | number;
      const selectable = selection ? (selection.isRowSelectable ? selection.isRowSelectable(row, index) : true) : true;
      return { key, row, index, selectable };
    });
  }, [data, rowKey, selection]);

  const rowMap = useMemo(() => {
    const map = new Map<string | number, T>();
    rowItems.forEach((item) => {
      map.set(item.key, item.row);
    });
    return map;
  }, [rowItems]);

  const selectableRows = useMemo(
    () => (selection ? rowItems.filter((item) => item.selectable) : []),
    [selection, rowItems],
  );

  const allSelected =
    selection?.mode === 'multiple' &&
    selectableRows.length > 0 &&
    selectableRows.every((item) => selectedSet.has(item.key));
  const partiallySelected =
    selection?.mode === 'multiple' &&
    selectableRows.length > 0 &&
    !allSelected &&
    selectableRows.some((item) => selectedSet.has(item.key));
  const headerCheckboxRef = useIndeterminate(Boolean(allSelected), partiallySelected);

  const isFocusControlled = typeof focusedRowKey !== 'undefined';
  const [internalFocusKey, setInternalFocusKey] = useState<string | number | null>(() =>
    typeof defaultFocusedRow !== 'undefined' ? defaultFocusedRow : null,
  );
  const activeFocusKey = (isFocusControlled ? focusedRowKey : internalFocusKey) ?? null;

  useEffect(() => {
    if (isFocusControlled || typeof defaultFocusedRow === 'undefined') {
      return;
    }
    setInternalFocusKey(defaultFocusedRow);
  }, [defaultFocusedRow, isFocusControlled]);

  useEffect(() => {
    if (isFocusControlled) return;
    if (rowItems.length === 0) {
      if (internalFocusKey !== null) {
        setInternalFocusKey(null);
        onFocusedRowChange?.(null, null);
      }
      return;
    }
    if (internalFocusKey !== null && rowItems.some((item) => item.key === internalFocusKey)) {
      return;
    }
    const fallback =
      (typeof defaultFocusedRow !== 'undefined' &&
        rowItems.find((item) => item.key === defaultFocusedRow)?.key) ??
      rowItems[0]?.key ??
      null;
    if (fallback !== internalFocusKey) {
      setInternalFocusKey(fallback);
      const fallbackRow = typeof fallback === 'undefined' || fallback === null ? null : rowMap.get(fallback) ?? null;
      onFocusedRowChange?.(fallback, fallbackRow);
    }
  }, [rowItems, internalFocusKey, isFocusControlled, defaultFocusedRow, onFocusedRowChange, rowMap]);

  const roundedClass =
    rounded === '2xl' ? 'rounded-2xl' : rounded === 'lg' ? 'rounded-lg' : rounded === 'md' ? 'rounded-md' : 'rounded-xl';

  const handleSelectAll = (checked: boolean) => {
    if (!selection || selection.mode !== 'multiple') return;
    if (!checked) {
      selection.onChange([], []);
      return;
    }
    const uniqueKeys: Array<string | number> = [];
    const seen = new Set<string | number>();
    selectableRows.forEach((item) => {
      if (!seen.has(item.key)) {
        seen.add(item.key);
        uniqueKeys.push(item.key);
      }
    });
    const rows = uniqueKeys.map((key) => rowMap.get(key)).filter(Boolean) as T[];
    selection.onChange(uniqueKeys, rows);
  };

  const handleSelectionChange = (rowItem: (typeof rowItems)[number], nextChecked: boolean) => {
    if (!selection || !rowItem.selectable) return;
    if (selection.mode === 'single') {
      selection.onChange(nextChecked ? [rowItem.key] : [], nextChecked ? [rowItem.row] : []);
      return;
    }
    const baseKeys = new Set<string | number>(selection.selectedKeys ?? []);
    if (nextChecked) {
      baseKeys.add(rowItem.key);
    } else {
      baseKeys.delete(rowItem.key);
    }
    const nextKeys = rowItems.filter((item) => baseKeys.has(item.key)).map((item) => item.key);
    const nextRows = nextKeys.map((key) => rowMap.get(key)).filter(Boolean) as T[];
    selection.onChange(nextKeys, nextRows);
  };

  const updateFocus = (key: string | number | null) => {
    const nextRow = key === null ? null : rowMap.get(key) ?? null;
    if (!isFocusControlled) {
      setInternalFocusKey(key);
    }
    onFocusedRowChange?.(key, nextRow);
  };

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    rowItem: (typeof rowItems)[number],
  ) => {
    const index = rowItems.findIndex((item) => item.key === rowItem.key);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = index < rowItems.length - 1 ? rowItems[index + 1] : rowItems[rowItems.length - 1];
      if (next) {
        updateFocus(next.key);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = index > 0 ? rowItems[index - 1] : rowItems[0];
      if (prev) {
        updateFocus(prev.key);
      }
    } else if (event.key === 'Home') {
      event.preventDefault();
      const first = rowItems[0];
      if (first) {
        updateFocus(first.key);
      }
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = rowItems[rowItems.length - 1];
      if (last) {
        updateFocus(last.key);
      }
    } else if ((event.key === ' ' || event.key === 'Spacebar') && selection) {
      event.preventDefault();
      if (!rowItem.selectable) return;
      const currentlySelected = selectedSet.has(rowItem.key);
      const nextChecked = selection.mode === 'multiple' ? !currentlySelected : true;
      handleSelectionChange(rowItem, nextChecked);
    }
  };

  const handleRowClick = (
    event: MouseEvent<HTMLTableRowElement>,
    rowItem: (typeof rowItems)[number],
  ) => {
    if (selection && selectOnRowClick && rowItem.selectable) {
      const target = event.target as HTMLElement;
      if (
        target.closest('button, a, [role="button"], input, label, [data-table-row-trigger="ignore"]')
      ) {
        updateFocus(rowItem.key);
        return;
      }
      const currentlySelected = selectedSet.has(rowItem.key);
      const nextChecked = selection.mode === 'multiple' ? !currentlySelected : !currentlySelected;
      handleSelectionChange(rowItem, nextChecked);
    }
    updateFocus(rowItem.key);
  };

  const focusIndex = activeFocusKey === null ? -1 : rowItems.findIndex((item) => item.key === activeFocusKey);
  const rovingIndex = focusIndex >= 0 ? focusIndex : 0;

  const headerClass =
    'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500';
  const bodyCellClass = 'px-4 py-3 text-sm text-gray-900 align-middle';

  const emptyNode =
    emptyState ??
    (
      <div className="py-16 text-center text-sm text-gray-500">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M10 2a8 8 0 015.293 14.293l3.707 3.707a1 1 0 01-1.414 1.414l-3.707-3.707A8 8 0 1110 2zm-6 8a6 6 0 1012 0 6 6 0 00-12 0z" />
          </svg>
        </div>
        暂无数据
      </div>
    );

  const selectionSummary =
    selection && selection.selectedKeys.length > 0 ? (
      <span className="text-sm text-primary">
        已选择 {selection.selectedKeys.length} 项
      </span>
    ) : null;

  const cardClass = card
    ? `flex flex-col ${roundedClass} border border-gray-200 bg-white shadow-sm`
    : '';

  return (
    <div className={`${cardClass} ${className}`} role="region" aria-label={typeof title === 'string' ? title : '表格'}>
      {(title || description || toolbar || onSearch) && (
        <div className="border-b border-gray-200 bg-white px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              {title && (
                <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
                  <div className="truncate">{title}</div>
                  <span className="text-gray-500">· {total} 项</span>
                </div>
              )}
              {description && <div className="text-xs text-gray-500">{description}</div>}
            </div>
            {(toolbar || onSearch) && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {toolbar}
                {onSearch && (
                  <div className="relative">
                    <input
                      type="search"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="h-9 w-56 rounded-lg border border-gray-200 pl-8 pr-3 text-sm text-gray-700 placeholder:text-gray-400 transition-[box-shadow,border-color] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <svg
                      aria-hidden
                      className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M12.9 14.32a6.5 6.5 0 111.414-1.414l3.386 3.387a1 1 0 01-1.414 1.414l-3.386-3.387zM13 8.5a4.5 4.5 0 10-9 0 4.5 4.5 0 009 0z" />
                    </svg>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        ref={scrollerRef}
        className={`relative overflow-x-auto ${stickyHeader ? 'overflow-y-auto' : 'overflow-y-visible'} nice-scrollbar ${scrollContainerClassName}`}
      >
        <table className="w-full table-auto border-separate border-spacing-0 text-left" role="grid">
          <thead
            className={`bg-gray-50 text-gray-600 ${stickyHeader ? 'sticky top-0 z-10' : ''} ${
              scrolled ? 'shadow-[0_2px_8px_rgba(15,23,42,0.08)]' : ''
            }`}
          >
            <tr>
              {selection && (
                <th
                  className={`${headerClass} ${stickyHeader ? 'bg-gray-50' : ''}`}
                  style={{ width: selection.columnWidth ?? 44 }}
                  scope="col"
                >
                  {selection.mode === 'multiple' ? (
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      aria-label={selection.headerTitle ?? '全选'}
                      checked={Boolean(allSelected)}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className={checkboxClass}
                    />
                  ) : (
                    <span className="sr-only">选择</span>
                  )}
                </th>
              )}
              {visibleColumns.map((col, index) => {
                const active = sortKey === col.key;
                const sortable = col.sortable ?? Boolean(onSort);
                const align =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';
                const intentClass = col.intent === 'actions' ? 'whitespace-nowrap text-right' : '';
                return (
                  <th
                    key={String(col.key)}
                    scope="col"
                    className={`${headerClass} ${align} ${intentClass} ${col.headerClassName ?? ''}`}
                    style={columnStyles[index]}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className="group flex w-full items-center gap-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                        onClick={() => onSort?.(col.key)}
                      >
                        <span className="truncate text-xs font-semibold text-gray-600 group-hover:text-gray-900">
                          {col.title}
                        </span>
                        <svg
                          viewBox="0 0 16 16"
                          className={`h-3.5 w-3.5 text-gray-400 transition-colors group-hover:text-gray-500 ${
                            active ? 'opacity-100' : 'opacity-60'
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
                      </button>
                    ) : (
                      <span className="truncate text-xs font-semibold text-gray-600">{col.title}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: Math.min(Math.max(pageSize, 4), 6) }).map((_, skeletonIndex) => (
                <tr key={`skeleton-${skeletonIndex}`} className="h-12">
                  {selection && (
                    <td className={`${bodyCellClass}`} style={{ width: selection.columnWidth ?? 44 }}>
                      <div className="h-4 w-4 rounded border border-gray-100 bg-gray-100" />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td key={String(col.key)} className={`${bodyCellClass}`}>
                      <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rowItems.length > 0 ? (
              rowItems.map((rowItem, rowIndex) => {
                const isSelected = selectedSet.has(rowItem.key);
                const isFocused = activeFocusKey !== null && rowItem.key === activeFocusKey;
                const tabIndex = rowItems.length === 0 ? -1 : rowIndex === rovingIndex ? 0 : -1;

                return (
                  <tr
                    key={rowItem.key}
                    data-selected={isSelected ? 'true' : undefined}
                    data-focus={isFocused ? 'true' : undefined}
                    className={[
                      zebra ? 'odd:bg-white even:bg-gray-50/60' : 'bg-white',
                      highlightOnHover ? 'hover:bg-gray-50' : '',
                      'transition-colors',
                      'focus:outline-none',
                      'data-[selected=true]:bg-primary/5 data-[selected=true]:hover:bg-primary/10',
                      'data-[focus=true]:outline data-[focus=true]:outline-2 data-[focus=true]:outline-primary/40 data-[focus=true]:outline-offset-[-2px]',
                    ].join(' ')}
                    tabIndex={tabIndex}
                    onFocus={() => updateFocus(rowItem.key)}
                    onKeyDown={(event) => handleRowKeyDown(event, rowItem)}
                    onClick={(event) => handleRowClick(event, rowItem)}
                    aria-selected={selection ? isSelected : undefined}
                    role="row"
                  >
                    {selection && (
                      <td
                        className={`${bodyCellClass}`}
                        style={{ width: selection.columnWidth ?? 44 }}
                      >
                        {selection.mode === 'multiple' ? (
                          <input
                            type="checkbox"
                            aria-label="选择行"
                            checked={isSelected}
                            disabled={!rowItem.selectable}
                            onChange={(e) => handleSelectionChange(rowItem, e.target.checked)}
                            className={checkboxClass}
                          />
                        ) : (
                          <input
                            type="radio"
                            name="table-row"
                            aria-label="选择行"
                            checked={isSelected}
                            disabled={!rowItem.selectable}
                            onChange={() => handleSelectionChange(rowItem, true)}
                            className={radioClass}
                          />
                        )}
                      </td>
                    )}
                    {visibleColumns.map((col, colIndex) => {
                      const align =
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';
                      const intentClass = col.intent === 'actions' ? 'whitespace-nowrap text-right' : '';
                      const value = col.render
                        ? col.render(rowItem.row, {
                            row: rowItem.row,
                            rowIndex,
                            key: rowItem.key,
                            isSelected,
                            isFocused,
                          })
                        : (rowItem.row[col.key as keyof T] as ReactNode);
                      const titleValue = col.tooltip
                        ? col.tooltip(rowItem.row)
                        : typeof value === 'string'
                        ? value
                        : undefined;

                      return (
                        <td
                          key={String(col.key)}
                          className={`${bodyCellClass} ${align} ${intentClass} ${col.className ?? ''}`}
                          style={columnStyles[colIndex]}
                          title={titleValue as string | undefined}
                        >
                          <div className={col.intent === 'actions' ? 'flex items-center justify-end gap-2 whitespace-nowrap' : 'truncate'}>
                            {value}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={visibleColumns.length + (selection ? 1 : 0)}
                  className="px-6 text-center"
                >
                  {emptyNode}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm text-gray-700">
        <div className="flex flex-wrap items-center gap-3">
          <span>共 {total} 项</span>
          {selectionSummary}
          {onPageSizeChange && (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="hidden sm:inline text-gray-500">每页</span>
              <select
                aria-label="每页条数"
                className="h-9 rounded-md border border-gray-300 px-2 text-sm transition-[box-shadow,border-color] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={pageSize}
                onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span className="hidden sm:inline text-gray-500">条</span>
            </div>
          )}
          {footerExtra}
        </div>

        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
      </div>
    </div>
  );
}