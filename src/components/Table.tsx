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
  enableSelectAll?: boolean;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  sortKey?: Column<T>['key'];
  sortDirection?: SortDirection;
  onSort?: (key: Column<T>['key']) => void;
  card?: boolean;
  loading?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  stickyHeader?: boolean;
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
  'transition-[border-color,box-shadow,background-color] focus-visible:ring-primary/40',
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

function SortIcon({ active, direction }: { active: boolean; direction?: SortDirection }) {
  const isAsc = active && direction === 'asc';
  const isDesc = active && direction === 'desc';
  return (
    <span className="flex flex-col items-center gap-[2px] leading-none">
      <svg
        viewBox="0 0 12 6"
        className={["h-2 w-2", isAsc ? 'text-primary' : 'text-slate-300'].join(' ')}
        aria-hidden
        focusable="false"
        fill="currentColor"
      >
        <path d="M6 0L11 6H1L6 0Z" />
      </svg>
      <svg
        viewBox="0 0 12 6"
        className={["h-2 w-2", isDesc ? 'text-primary' : 'text-slate-300'].join(' ')}
        aria-hidden
        focusable="false"
        fill="currentColor"
      >
        <path d="M6 6L1 0h10L6 6Z" />
      </svg>
    </span>
  );
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  page,
  pageSize,
  total,
  onPageChange,
  sortKey,
  sortDirection,
  onSort,
  card = false,
  loading = false,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
  stickyHeader = true,
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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const handleScroll = () => setScrolled(el.scrollTop > 0 || el.scrollLeft > 0);
    handleScroll();
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const visibleColumns = useMemo(() => columns.filter((col) => !col.hidden), [columns]);

  const hasFlexibleColumn = useMemo(
    () => visibleColumns.some((col) => typeof col.width === 'undefined'),
    [visibleColumns],
  );

  const flexibleWeight = useMemo(() => {
    if (!hasFlexibleColumn) return 1;
    return (
      visibleColumns.reduce((totalFlex, col) => {
        if (typeof col.width !== 'undefined') return totalFlex;
        return totalFlex + (col.flex ?? 1);
      }, 0) || 1
    );
  }, [visibleColumns, hasFlexibleColumn]);

  const columnLayouts = useMemo(() => {
    return visibleColumns.map((col) => {
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

  const columnWidthStyles = useMemo(
    () => columnLayouts.map((layout) => layout.width),
    [columnLayouts],
  );

  const selectionMode = selection?.mode === 'single' ? 'single' : 'multiple';
  const selectedKeysRef = selection?.selectedKeys;
  const selectedSet = useMemo(() => new Set<string | number>(selectedKeysRef ?? []), [selectedKeysRef]);
  const selectOnRowClick = selection?.selectOnRowClick ?? true;
  const enableSelectAll = selectionMode === 'multiple' && (selection?.enableSelectAll ?? true);

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
    enableSelectAll &&
    selectableRows.length > 0 &&
    selectableRows.every((item) => selectedSet.has(item.key));
  const partiallySelected =
    enableSelectAll &&
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

  const handleSelectAll = (nextChecked: boolean) => {
    if (!selection) return;
    if (!nextChecked) {
      selection.onChange([], []);
      return;
    }
    if (selectionMode === 'single') {
      const first = selectableRows[0];
      if (first) {
        selection.onChange([first.key], [first.row]);
      }
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
    if (selectionMode === 'single') {
      const keys = nextChecked ? [rowItem.key] : [];
      const rows = nextChecked ? [rowItem.row] : [];
      selection.onChange(keys, rows);
      return;
    }
    const baseKeys = new Set<string | number>(selectedKeysRef ?? []);
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
      const nextChecked = !currentlySelected;
      handleSelectionChange(rowItem, nextChecked);
    }
  };

  const handleRowClick = (
    event: MouseEvent<HTMLTableRowElement>,
    rowItem: (typeof rowItems)[number],
  ) => {
    if (selection && selectOnRowClick && rowItem.selectable) {
      const target = event.target as HTMLElement;
      if (target.closest('button, a, [role="button"], input, label, [data-table-row-trigger="ignore"]')) {
        updateFocus(rowItem.key);
      } else {
        const currentlySelected = selectedSet.has(rowItem.key);
        const nextChecked = !currentlySelected;
        handleSelectionChange(rowItem, nextChecked);
      }
    }
    updateFocus(rowItem.key);
  };

  const focusIndex = activeFocusKey === null ? -1 : rowItems.findIndex((item) => item.key === activeFocusKey);
  const rovingIndex = focusIndex >= 0 ? focusIndex : 0;

  const headerClass = 'px-4 py-3 text-xs font-medium text-gray-600';
  const bodyCellClass = 'px-4 py-3 text-sm text-gray-900 align-middle';

  const emptyNode =
    emptyState ?? (
      <div className="py-16 text-center text-sm text-gray-500">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M10 2a8 8 0 015.293 14.293l3.707 3.707a1 1 0 01-1.414 1.414l-3.707-3.707A8 8 0 1110 2zm-6 8a6 6 0 1012 0 6 6 0 00-12 0z" />
          </svg>
        </div>
        暂无数据
      </div>
    );

  const selectionCount = selectedKeysRef?.length ?? 0;
  const selectionSummary =
    selection && selectionCount > 0 ? (
      <span className="text-sm text-primary">已选择 {selectionCount} 项</span>
    ) : null;

  const containerClass = [
    card ? `flex flex-col ${roundedClass} border border-gray-200 bg-white shadow-sm` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass} role="region">
      <div
        ref={scrollerRef}
        className={`relative overflow-x-auto ${stickyHeader ? 'overflow-y-auto' : 'overflow-y-visible'} nice-scrollbar ${scrollContainerClassName}`}
      >
        <table className="w-full table-auto border-separate border-spacing-0 text-left" role="grid">
          <colgroup>
            {selection ? <col style={{ width: selection.columnWidth ?? 48 }} /> : null}
            {columnWidthStyles.map((width, index) => (
              <col key={`col-${index}`} style={width ? { width } : undefined} />
            ))}
          </colgroup>
          <thead
            className={`bg-gray-50 text-gray-600 ${stickyHeader ? 'sticky top-0 z-10' : ''} ${
              scrolled ? 'shadow-[0_2px_8px_rgba(15,23,42,0.08)]' : ''
            }`}
          >
            <tr>
              {selection && (
                <th
                  className={`${headerClass} sticky left-0 z-30 bg-gray-50 ${stickyHeader ? 'shadow-[inset_-1px_0_0_rgba(15,23,42,0.06)]' : ''}`}
                  style={{ width: selection.columnWidth ?? 48 }}
                  scope="col"
                >
                  {enableSelectAll ? (
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
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';
                const justifyClass =
                  col.align === 'right'
                    ? 'justify-end'
                    : col.align === 'center'
                    ? 'justify-center'
                    : 'justify-start';
                const intentClass = col.intent === 'actions' ? 'sticky right-0 z-30 bg-gray-50 pl-4 shadow-[inset_1px_0_0_rgba(15,23,42,0.06)]' : '';
                return (
                  <th
                    key={String(col.key)}
                    scope="col"
                    className={`${headerClass} ${alignClass} ${intentClass} ${col.headerClassName ?? ''}`}
                    style={columnLayouts[index]}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className={`group inline-flex w-full items-center ${justifyClass} gap-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20`}
                        onClick={() => onSort?.(col.key)}
                      >
                        <span className="truncate text-xs font-medium text-gray-600 group-hover:text-gray-900">
                          {col.title}
                        </span>
                        <SortIcon active={active} direction={active ? (sortDirection as SortDirection | undefined) : undefined} />
                      </button>
                    ) : (
                      <span className="truncate text-xs font-medium text-gray-600">{col.title}</span>
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
                    <td className={`${bodyCellClass} sticky left-0 z-20 bg-[#f8fafc]`} style={{ width: selection.columnWidth ?? 48 }}>
                      <div className="h-4 w-4 rounded border border-gray-100 bg-gray-100" />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td key={String(col.key)} className={bodyCellClass}>
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
                const rowBg = zebra ? (rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/60') : 'bg-white';
                const selectedBg = isSelected ? 'bg-primary/5 hover:bg-primary/10' : '';

                return (
                  <tr
                    key={rowItem.key}
                    data-selected={isSelected ? 'true' : undefined}
                    data-focus={isFocused ? 'true' : undefined}
                    className={[
                      'group transition-colors focus:outline-none',
                      rowBg,
                      highlightOnHover ? 'hover:bg-gray-50' : '',
                      selectedBg,
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
                        className={`${bodyCellClass} sticky left-0 z-20 bg-inherit backdrop-blur-[0.01px]`}
                        style={{ width: selection.columnWidth ?? 48 }}
                      >
                        <input
                          type="checkbox"
                          aria-label="选择行"
                          checked={isSelected}
                          disabled={!rowItem.selectable}
                          onChange={(e) => handleSelectionChange(rowItem, e.target.checked)}
                          className={checkboxClass}
                        />
                      </td>
                    )}
                    {visibleColumns.map((col, colIndex) => {
                      const alignClass =
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';
                      const isAction = col.intent === 'actions';
                      const stickyRightClass = isAction ? 'sticky right-0 z-20 bg-inherit backdrop-blur-[0.01px] pl-4 shadow-[inset_1px_0_0_rgba(15,23,42,0.04)]' : '';
                      const intentClass = isAction ? 'whitespace-nowrap text-right' : '';
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
                          className={[
                            bodyCellClass,
                            alignClass,
                            intentClass,
                            stickyRightClass,
                            col.className ?? '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          style={columnLayouts[colIndex]}
                          title={titleValue as string | undefined}
                        >
                          <div
                            className={
                              col.intent === 'actions'
                                ? 'flex items-center justify-end gap-2 whitespace-nowrap'
                                : col.intent === 'status'
                                ? 'flex items-center gap-2'
                                : 'truncate'
                            }
                          >
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
                <td colSpan={visibleColumns.length + (selection ? 1 : 0)} className="px-6 text-center">
                  {emptyNode}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-3 text-sm text-gray-700">
        <div className="flex flex-wrap items-center gap-3">
          <span>共 {total} 项</span>
          {selectionSummary}
          {onPageSizeChange ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="hidden sm:inline">每页</span>
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
              <span className="hidden sm:inline">条</span>
            </div>
          ) : null}
          {footerExtra}
        </div>

        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
      </div>
    </div>
  );
}