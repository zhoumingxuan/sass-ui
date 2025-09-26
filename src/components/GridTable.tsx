'use client';

import type {
  CSSProperties,
  ReactNode,
  MouseEvent as ReactMouseEvent,
} from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from './Checkbox';

import {
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,             
} from 'lucide-react';

import ActionLink from './ActionLink';

type FixedSide = 'left' | 'right';
type SortDirection = 'asc' | 'desc';

export type GridCellRenderContext<T> = {
  row: T;
  rowIndex: number;
  key: string | number;
  isSelected: boolean;
  isHovered: boolean;
};

export type GridColumn<T> = {
  key: keyof T | string;
  title: ReactNode;
  align?: 'left' | 'center' | 'right';
  styles?:CSSProperties;
  width?: number | string;
  sortable?: boolean;
  sortKey?: keyof T;
  render?: (row: T, context: GridCellRenderContext<T>) => ReactNode;
  tooltip?: (row: T) => string;
  className?: string;
  headerClassName?: string;
  intent?: 'data' | 'actions' | 'status' | 'meta';
  semantic?: 'text' | 'number' | 'datetime';
  hidden?: boolean;
  fixed?: FixedSide;
};

type SelectionMode = 'single' | 'multiple';

export type GridSelection<T> = {
  mode?: SelectionMode;
  selectedKeys: Array<string | number>;
  onChange: (keys: Array<string | number>, rows: T[]) => void;
  selectOnRowClick?: boolean;
  isRowSelectable?: (row: T, index: number) => boolean;
  enableSelectAll?: boolean;
  headerTitle?: string;
  columnWidth?: number;
};

type RowItem<T> = {
  row: T;
  key: string | number;
  index: number;
  selectable: boolean;
};

/** —— 内置操作列：通用配置（仅保留实际使用字段） —— */
export type RowAction<T> = {
  key: string;
  label: ReactNode;
  onClick?: (row: T) => void;
  disabled?: boolean;
};
export type RowActionsConfig<T> = {
  title?: ReactNode;
  width?: number | string;
  getActions: (row: T) => RowAction<T>[];
};

type GridTableProps<T> = {
  columns: Array<GridColumn<T>>;
  data: T[];
  rowHeight?: number;
  headerHeight?: number;
  zebra?: boolean;
  rowKey?: (row: T, index: number) => string | number;
  className?: string;
  emptyState?: ReactNode;
  loading?: boolean;
  loadingState?: ReactNode;
  selection?: GridSelection<T>;
  onRowClick?: (row: T, context: GridCellRenderContext<T>, event: ReactMouseEvent<HTMLDivElement>) => void;
  onRowDoubleClick?: (row: T, context: GridCellRenderContext<T>, event: ReactMouseEvent<HTMLDivElement>) => void;
  sortKey?: GridColumn<T>['key'];
  sortDirection?: SortDirection;
  onSort?: (key: GridColumn<T>['key']) => void;

  /** —— 序号列 —— */
  showIndex?: boolean;
  
  /** —— 内置操作列（通用） —— */
  rowActions?: RowActionsConfig<T>;

  /** 行焦点（点击行改变样式；不含键盘导航） */
  enableRowFocus?: boolean;
  focusedRowKey?: string | number | null;
  defaultFocusedRow?: string | number | null;
  onFocusedRowChange?: (key: string | number | null, row: T | null) => void;

  /** —— 分页（沿用 Table 的模式：数据由外部切片；组件只展示控制） —— */
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
   /** 轻量快捷键：Alt + ← / → 翻页；Alt + Home / End 首末页（默认开启） */
  paginationKeyboard?: boolean;
  /** 是否显示“共 N 项”（默认 true） */
  showTotal?: boolean;
};

type ColumnMeta<T> = {
  column: GridColumn<T>;
  width: number | string;
  styles?: CSSProperties;
  className?:string;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function shouldIgnoreRowToggle(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('button, a, [role="button"], input, label, [data-table-row-trigger="ignore"]'));
}

function cssNumber(varName: string, fallback: number) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName);
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

// 与现有行为保持一致：根据 intent/semantic 给默认对齐
function resolveAlign<T>(col: GridColumn<T>): 'left' | 'center' | 'right' {
  if (col.intent === 'actions') return 'center';
  if (col.align) return col.align;
  switch (col.semantic) {
    case 'number':
      return 'right';
    case 'datetime':
      return 'center';
    case 'text':
      return 'center';
    default:
      return 'left';
  }
}

function getSemanticClass<T>(col: GridColumn<T>): string {
  switch (col.semantic) {
    case 'number':
      return 'tabular-nums';
    default:
      return '';
  }
}


function buildTemplate<T>(metas: ColumnMeta<T>[]): string {
  return metas
    .map((meta) => {
      const col = meta.column;
      if (col.width === undefined ) return 'auto';
      if (typeof col.width === 'number' && col.width !== 0) return `${col.width}px`;
      if (typeof col.width === 'string') return col.width;
      return `${col.width}`;
    })
    .join(' ');
}

function SortIcon({ active, direction }: { active: boolean; direction?: SortDirection }) {
  const isAsc = active && direction === 'asc';
  const isDesc = active && direction === 'desc';
  return (
    <span className="flex flex-col items-center gap-0.5 leading-none">
      <svg
        viewBox="0 0 12 6"
        className={["h-1.5 w-1.5", isAsc ? 'text-primary' : 'text-slate-300'].join(' ')}
        aria-hidden
        focusable="false"
        fill="currentColor"
      >
        <path d="M6 0L11 6H1L6 0Z" />
      </svg>
      <svg
        viewBox="0 0 12 6"
        className={["h-1.5 w-1.5", isDesc ? 'text-primary' : 'text-slate-300'].join(' ')}
        aria-hidden
        focusable="false"
        fill="currentColor"
      >
        <path d="M6 6L1 0h10L6 6Z" />
      </svg>
    </span>
  );
}

function resolveRowKey<T>(row: T, index: number, fallback?: GridTableProps<T>['rowKey']): string | number {
  if (fallback) return fallback(row, index);
  const fromId = (row as { id?: string | number })?.id;
  if (typeof fromId !== 'undefined') return fromId!;
  const fromKey = (row as { key?: string | number })?.key;
  if (typeof fromKey !== 'undefined') return fromKey!;
  return index;
}

function makeMeta<T>(col: GridColumn<T>): ColumnMeta<T> {
  const align = resolveAlign(col);
  return {
    column: col,
    width: col.width!==undefined?col.width:'auto',
    styles:col.styles?{textAlign:align,...col.styles}:{textAlign:align},
    className:col.className
  };
}

export default function GridTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowHeight = cssNumber('--gt-row-h', 36),
  headerHeight = cssNumber('--gt-header-h', 36),
  zebra = true,
  rowKey,
  className = '',
  emptyState,
  loading = false,
  loadingState,
  selection,
  onRowClick,
  onRowDoubleClick,
  sortKey,
  sortDirection,
  onSort,
  showIndex = false,
  enableRowFocus = false,
  focusedRowKey,
  defaultFocusedRow,
  onFocusedRowChange,
  rowActions,
  /** 分页 */
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
  paginationKeyboard = true,
  showTotal = true,
}: GridTableProps<T>) {
  // ==== 视窗度量 ====
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewHeight, setViewHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const rafIdRef = useRef<number | null>(null);
  const scrollCacheRef = useRef({
    scrollTop: 0,
    hasLeftShadow: false,
    hasRightShadow: false,
  });

  
  // 横向阴影开关（仅样式）
  const [hasLeftShadow, setHasLeftShadow] = useState(false);
  const [hasRightShadow, setHasRightShadow] = useState(false);

  // 是否具备分页（沿用 Table：数据由父组件切片，这里仅展示控制）
  const hasPagination =
    typeof page === 'number' &&
    typeof pageSize === 'number' &&
    typeof total === 'number' &&
    typeof onPageChange === 'function';

  // 轻量快捷键：仅在鼠标悬停表格区域时生效，避免全局抢键
  const [hotkeyArmed, setHotkeyArmed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const lastHeightRef = { current: 0 };
    const measure = () => {
      const h = el.clientHeight;
      if (h !== lastHeightRef.current) {
        lastHeightRef.current = h;
        setViewHeight(h);
      }
    };
    measure();

    let ro: ResizeObserver | null = null;
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }

    const scheduleScrollCalc = () => {
      if (rafIdRef.current != null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const { scrollLeft, scrollTop: st, clientWidth, scrollWidth } = el;
        const next = {
          scrollTop: st,
          hasLeftShadow: scrollLeft > 0,
          hasRightShadow: scrollLeft + clientWidth < scrollWidth - 1,
        };
        const prev = scrollCacheRef.current;

        // 仅对变更的字段 setState
        if (next.scrollTop !== prev.scrollTop) setScrollTop(next.scrollTop);
        if (next.hasLeftShadow !== prev.hasLeftShadow) setHasLeftShadow(next.hasLeftShadow);
        if (next.hasRightShadow !== prev.hasRightShadow) setHasRightShadow(next.hasRightShadow);

        scrollCacheRef.current = next;
      });
    };

    const onScrollOrResize = () => {
      // 被动监听，统一交给 rAF 批处理
      scheduleScrollCalc();
    };

    el.addEventListener('scroll', onScrollOrResize, { passive: true });
    // 初始化一次阴影状态
    onScrollOrResize();

    const onEnter = () => setHotkeyArmed(true);
    const onLeave = () => setHotkeyArmed(false);
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('scroll', onScrollOrResize);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      if (ro) ro.disconnect();
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);


 useEffect(() => {
    if (!hasPagination || !paginationKeyboard) return;
    const handler = (e: KeyboardEvent) => {
      if (!hotkeyArmed) return;
      if (!e.altKey) return;
      if (loading) return;
      const totalPages = Math.max(1, Math.ceil((total ?? 0) / (pageSize ?? 1)));
      const p = page ?? 1;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPageChange?.(Math.max(1, p - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onPageChange?.(Math.min(totalPages, p + 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        onPageChange?.(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        onPageChange?.(totalPages);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasPagination, paginationKeyboard, hotkeyArmed, loading, page, pageSize, total, onPageChange]);

  // ==== 数据准备（含排序） ====
  const rows: Array<RowItem<T>> = useMemo(() => {
    let source = data;
    if (sortKey && sortDirection) {
      const target = columns.find((col) => (col.sortKey ?? col.key) === sortKey);
      if (target && (target.sortable ?? false) && target.intent !== 'actions') {
        const dataKey = (target.sortKey ?? target.key) as keyof T;
        const collator = typeof Intl !== 'undefined' ? new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' }) : null;
        const next = [...data];
        next.sort((a, b) => {
          const aValue = (a as Record<string, unknown>)[dataKey as string] as unknown;
          const bValue = (b as Record<string, unknown>)[dataKey as string] as unknown;
          if (aValue == null && bValue == null) return 0;
          if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
          if (bValue == null) return sortDirection === 'asc' ? 1 : -1;
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          }
          if (aValue instanceof Date && bValue instanceof Date) {
            return sortDirection === 'asc'
              ? aValue.getTime() - bValue.getTime()
              : bValue.getTime() - aValue.getTime();
          }
          const left = String(aValue);
          const right = String(bValue);
          if (collator) {
            return sortDirection === 'asc' ? collator.compare(left, right) : collator.compare(right, left);
          }
          return sortDirection === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
        });
        source = next;
      }
    }
    return source.map((row, index) => {
      const key = resolveRowKey(row, index, rowKey);
      const selectable = selection ? (selection.isRowSelectable ? selection.isRowSelectable(row, index) : true) : true;
      return { row, key, index, selectable };
    });
  }, [columns, data, rowKey, selection, sortDirection, sortKey]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (typeof sortKey === 'undefined') return;
    containerRef.current.scrollTop = 0;
    scrollCacheRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [sortKey, sortDirection]);

  // ==== 列切分 ====
  const metasAll = useMemo(() => {
    const cols = columns
      .filter((c) => !c.hidden)
      .map<GridColumn<T>>((c) => {
        if (!c.fixed && c.intent === 'actions') return { ...c, fixed: 'right' };
        return c;
      })
      .map(makeMeta<T>);

    const hasExternalActions = columns.some((c) => c.intent === 'actions' || c.key === '__actions__');

    const selectionMeta: ColumnMeta<T> | null = selection
      ? makeMeta<T>({
          key: '__selection__',
          title: selection.headerTitle ?? '',
          align: 'center',
          intent: 'meta',
          semantic: 'text',
          fixed: 'left',
          width: selection.columnWidth,
        } as GridColumn<T>)
      : null;

    const indexMeta: ColumnMeta<T> | null = showIndex
      ? makeMeta<T>({
          key: '__index__',
          title: '序号',
          align: 'center',
          intent: 'meta',
          semantic: 'text',
          fixed: 'left',
        } as GridColumn<T>)
      : null;

    const actionsMeta: ColumnMeta<T> | null =
      !hasExternalActions && rowActions
        ? makeMeta<T>({
            key: '__actions__',
            title: rowActions.title ?? '操作',
            width: rowActions.width,
            align: 'center',
            intent: 'actions',
            fixed: 'right',
          } as GridColumn<T>)
        : null;

    const metas: ColumnMeta<T>[] = [];
    if (selectionMeta) metas.push(selectionMeta);
    if (indexMeta) metas.push(indexMeta);
    metas.push(...cols);
    if (actionsMeta) metas.push(actionsMeta);
    return metas;
  }, [columns, selection, showIndex, rowActions]);

  const metasLeft = useMemo(() => metasAll.filter((m) => m.column.fixed === 'left'), [metasAll]);
  const metasRight = useMemo(() => metasAll.filter((m) => m.column.fixed === 'right'), [metasAll]);
  const metasCenter = useMemo(() => metasAll.filter((m) => !m.column.fixed), [metasAll]);

  const templateLeft = useMemo(() => buildTemplate(metasLeft), [metasLeft]);
  const templateCenter = useMemo(() => buildTemplate(metasCenter), [metasCenter]);
  const templateRight = useMemo(() => buildTemplate(metasRight), [metasRight]);

  // ==== 可见切片 ====
  const fullHeight = useMemo(() => headerHeight + rowHeight * rows.length, [headerHeight, rowHeight, rows.length]);

  const visibleRows = useMemo(() => {
    if (viewHeight < headerHeight) return [];
    const visible = Math.max(viewHeight - headerHeight, 0);
    const endIndex = Math.floor((scrollTop + visible) / rowHeight) + 1;
    const startIndex = Math.max(Math.floor(scrollTop / rowHeight) - 1, 0);
    // 记住 scrollTop 以便翻页时轻扫到顶部
    return rows.slice(startIndex, endIndex);
  }, [rows, scrollTop, viewHeight, headerHeight, rowHeight]);

  // ==== 选择/悬停/焦点 ====
  const [hoverKey, setHoverKey] = useState<string | number | null>(null);
  const selectedSet = useMemo(() => new Set(selection?.selectedKeys ?? []), [selection?.selectedKeys]);

  // 行焦点（点击触发；可受控/非受控）
  const isFocusControlled = typeof focusedRowKey !== 'undefined';
  const [internalFocusKey, setInternalFocusKey] = useState<string | number | null>(
    typeof defaultFocusedRow !== 'undefined' ? defaultFocusedRow : null
  );
  const activeFocusKey = enableRowFocus
    ? (isFocusControlled ? focusedRowKey ?? null : internalFocusKey)
    : null;

  const updateFocus = useCallback((key: string | number | null) => {
    if (!enableRowFocus) return;
    if (!isFocusControlled) setInternalFocusKey(key);
    const row = key == null ? null : rows.find(r => r.key === key)?.row ?? null;
    onFocusedRowChange?.(key, row);
  }, [enableRowFocus, isFocusControlled, onFocusedRowChange, rows]);

  useEffect(() => {
    if (!enableRowFocus) return;
    if (activeFocusKey != null && !rows.some(r => r.key === activeFocusKey)) {
      updateFocus(null);
    }
  }, [rows, enableRowFocus, activeFocusKey, updateFocus]);

  useEffect(() => {
    if (!enableRowFocus) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) updateFocus(null);
    };
    document.addEventListener('pointerdown', onDocPointerDown, true);
    return () => document.removeEventListener('pointerdown', onDocPointerDown, true);
  }, [enableRowFocus, updateFocus]);

  // === Region ===
  const Region: React.FC<{
    metas: ColumnMeta<T>[];
    type: 'left' | 'center' | 'right';
    template: string;
  }> = ({ metas, template, type }) => {
    const zIndex = type === 'center' ? 99 : 100;

    return (
      <div
        className={cx(
          'w-auto grid gap-0 overflow-visible',
          type !== 'center' ? 'sticky border-gray-200' : '',
          type === 'left' ? 'left-0 gt-region--left' : type === 'right' ? 'right-0 gt-region--right' : 'gt-region--center'
        )}
        style={{ gridTemplateColumns: template, zIndex }}
      >
        {/* 表头 */}
        {metas.map((m) => {
          const isSelection = m.column.key === '__selection__';
          const isIndex = m.column.key === '__index__';
          const isActions = m.column.key === '__actions__';
          const align = resolveAlign(m.column);
          const justifyClass =
            align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';
          const sortable = (m.column.sortable ?? false) && m.column.intent !== 'actions';
          const effectiveSortKey = (m.column.sortKey ?? m.column.key) as GridColumn<T>['key'];
          const active = sortable && sortKey === effectiveSortKey;
          return (
            <div
              key={`h-${String(m.column.key)}`}
              className={cx(
                isSelection || isActions ? 'flex items-center justify-center' : '',
                'gt-head-cell sticky top-0 border-b border-gray-200 bg-gray-50 whitespace-nowrap',
                type === 'center' ? 'min-w-full' : '',
                'px-2 text-xs font-medium text-gray-600',
                m.column.headerClassName
              )}
              style={{ height: headerHeight,...m.styles }}
            >
              {isSelection ? (
                selection?.enableSelectAll ? (
                  <Checkbox
                    checked={Boolean(
                      selection &&
                        rows.filter((it) => it.selectable).length > 0 &&
                        rows.filter((it) => it.selectable).every((it) => selectedSet.has(it.key))
                    )}
                    aria-label={selection?.headerTitle ?? '全选'}
                    onChange={() => {
                      if (!selection?.enableSelectAll) return;
                      const selectable = rows.filter((it) => it.selectable);
                      const every = selectable.every((it) => selectedSet.has(it.key));
                      if (every) selection.onChange([], []);
                      else selection.onChange(selectable.map((it) => it.key), selectable.map((it) => it.row));
                    }}
                  />
                ) : (
                  <span className="sr-only">选择</span>
                )
              ) : isIndex ? (
                <span>序号</span>
              ) : isActions ? (
                <span>{(rowActions?.title ?? '操作') as ReactNode}</span>
              ) : sortable ? (
                <button
                  type="button"
                  className={cx(
                    'group inline-flex w-full items-center gap-1.5 truncate text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
                    justifyClass
                  )}
                  onClick={() => onSort?.(m.column.key)}
                >
                  <span className="truncate text-gray-600 group-hover:text-gray-900">{m.column.title}</span>
                  <SortIcon active={active} direction={active ? (sortDirection as SortDirection | undefined) : undefined} />
                </button>
              ) : (
                <span className="truncate">{m.column.title}</span>
              )}
            </div>
          );
        })}

        {/* 内容单元格（可见切片） */}
        {visibleRows.map((item) =>
          metas.map((m) => {
            const isSelection = m.column.key === '__selection__';
            const isIndex = m.column.key === '__index__';
            const isActions = m.column.key === '__actions__';
            const isSelected = selectedSet.has(item.key);
            const isHovered = hoverKey === item.key;
            const isFocused = activeFocusKey != null && activeFocusKey === item.key;

            const base = zebra ? (item.index % 2 === 0 ? 'var(--gt-zebra-even)' : 'var(--gt-zebra-odd)') : 'var(--gt-zebra-even)';

            let bg = base;
            if (enableRowFocus && isFocused) {
              bg = isHovered ? 'var(--gt-focused-hover)' : 'var(--gt-focused)';
            } else if (isSelected) {
              bg = isHovered ? 'var(--gt-selected-hover)' : 'var(--gt-selected)';
            } else if (isHovered) {
              bg = 'var(--gt-hover)';
            }

            const commonProps = {
              className: cx(
                'gt-cell overflow-hidden whitespace-nowrap',
                'px-2 text-sm text-gray-900',
                isSelection || isActions ? 'flex items-center justify-center' : '',
                m.column.className
              ),
              style: {
                height: rowHeight,
                backgroundColor: bg,
                ...m.styles,
              } as CSSProperties,
              'data-focused': isFocused ? 'true' : undefined,
              onMouseEnter: () =>
                setHoverKey((k) => (k === item.key ? k : item.key)),
              onMouseLeave: () =>
                setHoverKey((k) => (k === item.key ? null : k)),

              title: m.column.tooltip ? m.column.tooltip(item.row) : undefined,
              onClick: (e: ReactMouseEvent<HTMLDivElement>) => {
                const ctx: GridCellRenderContext<T> = {
                  row: item.row,
                  rowIndex: item.index,
                  key: item.key,
                  isSelected,
                  isHovered,
                };
                if (selection?.selectOnRowClick && item.selectable && !shouldIgnoreRowToggle(e.target)) {
                  if (selection.mode === 'single') selection.onChange([item.key], [item.row]);
                  else {
                    const next = new Set(selection.selectedKeys ?? []);
                    next.has(item.key) ? next.delete(item.key) : next.add(item.key);
                    const keys = Array.from(next);
                    const rowsPicked = rows.filter((r) => next.has(r.key)).map((r) => r.row);
                    selection.onChange(keys, rowsPicked);
                  }
                }
                onRowClick?.(item.row, ctx, e);
                // 行焦点
                if (enableRowFocus) updateFocus(item.key);
              },
              onDoubleClick: (e: ReactMouseEvent<HTMLDivElement>) => {
               const ctx: GridCellRenderContext<T> = {
                  row: item.row,
                  rowIndex: item.index,
                  key: item.key,
                  isSelected,
                  isHovered,
                };
                onRowDoubleClick?.(item.row, ctx, e);
              },
            } as const;

            if (isSelection) {
              return (
                <div key={`b-${String(m.column.key)}-${String(item.key)}`} {...commonProps}>
                  <Checkbox
                    checked={isSelected}
                    disabled={!item.selectable}
                    onChange={() => {
                      if (!selection) return;
                      const mode = selection.mode ?? 'multiple';
                      if (mode === 'single') selection.onChange([item.key], [item.row]);
                      else {
                        const next = new Set(selection.selectedKeys ?? []);
                        next.has(item.key) ? next.delete(item.key) : next.add(item.key);
                        const keys = Array.from(next);
                        const rowsPicked = rows.filter((r) => next.has(r.key)).map((r) => r.row);
                        selection.onChange(keys, rowsPicked);
                      }
                    }}
                    aria-label="选择行"
                  />
                </div>
              );
            }

            if (isIndex) {
              return (
                <div key={`b-${String(m.column.key)}-${String(item.key)}`} {...commonProps}>
                  <div className="text-center tabular-nums">{item.index + 1}</div>
                </div>
              );
            }

            if (isActions) {
              const acts = rowActions?.getActions ? rowActions.getActions(item.row) : [];
              return (
                <div key={`b-${String(m.column.key)}-${String(item.key)}`} {...commonProps}>
                  <div className="flex items-center justify-center space-x-1" data-table-row-trigger="ignore">
                    {acts.map((a) => (
                      <ActionLink
                        tone="primary"
                        size='xs'
                        key={a.key}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!a.disabled) a.onClick?.(item.row);
                        }}
                        disabled={a.disabled}
                        className="text-[0.8em] leading-none"
                      >
                        {a.label}
                      </ActionLink>
                    ))}
                  </div>
                </div>
              );
            }

            const ctx: GridCellRenderContext<T> = {
              row: item.row,
              rowIndex: item.index,
              key: item.key,
              isSelected,
              isHovered,
            };

            if (typeof m.column.render === 'function') {
              return (
                <div key={`b-${String(m.column.key)}-${String(item.key)}`} {...commonProps}>
                  {m.column.render(item.row, ctx)}
                </div>
              );
            }

            const value = item.row[m.column.key as keyof T] as ReactNode;

            return (
              <div key={`b-${String(m.column.key)}-${String(item.key)}`} {...commonProps}>
                <div className="truncate">{value}</div>
              </div>
            );
          })
        )}
      </div>
    );
  };

 // === 默认空态（写死）：lucide 图标 + 文案 ===
  const emptyNode = emptyState ?? (
    <div className="text-center select-none">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
        <FileQuestion className="h-5 w-5 text-gray-300" aria-hidden />
      </div>
      <div className="text-sm text-gray-500">没有可显示的内容</div>
    </div>
  );

  // === 轻量加载态：半透明遮罩 + 中心旋转指示器（顶层兄弟，覆盖满容器） ===
  const LoadingOverlay = ({ text }: { text?: ReactNode }) => (
    <div
      className="absolute left-0 right-0 bottom-0 top-0 z-[200] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />
      <div className="relative flex items-center gap-3 bg-white/90 px-3 py-2 text-sm text-gray-600 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden />
        <span>{text ?? '加载中…'}</span>
      </div>
    </div>
  );

  const isEmpty = rows.length === 0;
  const showEmpty = !loading && isEmpty;
  const showLoading = loading;

  /** ===== 分页条：左 = 总数+页信息 | 中 = 导航 | 右 = 每页+跳转 ===== */
  const PaginationBar = () => {
    if (!hasPagination) return null;

    const current = page ?? 1;
    const size = pageSize ?? 10;
    const totalCount = total ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, size)));
    const atFirst = current <= 1;
    const atLast = current >= totalPages;

    const jump = (p: number) => onPageChange?.(Math.min(Math.max(1, p), totalPages));

    // —— 指定页交互（受控输入 + 边界） —— //
    const [raw, setRaw] = useState<string>(String(current));
    useEffect(() => setRaw(String(current)), [current, totalPages]);

    const clamp = (n: number) => Math.min(Math.max(1, Math.trunc(n)), totalPages);
    const parseToPage = (v: string): number | null => {
      if (!v) return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return null;
      return clamp(n);
    };
    const commit = () => {
      const n = parseToPage(raw);
      if (n == null) { setRaw(String(current)); return; }
      if (n !== current) jump(n);
    };
    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); setRaw(String(clamp(Number(raw || current) + 1))); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setRaw(String(clamp(Number(raw || current) - 1))); }
    };

    const disabledNav = showLoading || totalPages <= 1;

    return (
      <div
        className={cx(
          'grid items-center border-t border-gray-200 bg-white px-4 py-2 text-[13px] text-gray-700 select-none',
          'grid-cols-[1fr_auto_1fr]'
        )}
      >
        {/* 左侧：总数 + 当前/总页（并排，固定间距） */}
        <div className="flex items-center gap-6 min-w-0">
          {showTotal && (
            <span className="shrink-0 text-gray-600">
              共 <span className="tabular-nums">{totalCount}</span> 项
            </span>
          )}
          <span className="shrink-0 text-gray-600">
            第 <span className="tabular-nums">{current}</span> / <span className="tabular-nums">{totalPages}</span> 页
          </span>
        </div>

        {/* 中间：导航按钮（等距） */}
        <div className="flex items-center justify-center gap-2">
          <ActionLink variant='ghost' size='xs' iconOnly onClick={() => jump(1)} disabled={disabledNav || atFirst} aria-label="首页 (Alt+Home)">
            <ChevronsLeft className="h-4 w-4" />
          </ActionLink>
          <ActionLink variant='ghost' size='xs' iconOnly onClick={() => jump(current - 1)} disabled={disabledNav || atFirst} aria-label="上一页 (Alt+←)">
            <ChevronLeft className="h-4 w-4" />
          </ActionLink>
          <ActionLink variant='ghost' size='xs' iconOnly onClick={() => jump(current + 1)} disabled={disabledNav || atLast} aria-label="下一页 (Alt+→)">
            <ChevronRight className="h-4 w-4" />
          </ActionLink>
          <ActionLink variant='ghost' size='xs' iconOnly onClick={() => jump(totalPages)} disabled={disabledNav || atLast} aria-label="末页 (Alt+End)">
            <ChevronsRight className="h-4 w-4" />
          </ActionLink>
        </div>

        {/* 右侧：每页条数 + 指定页（紧凑、统一高度/圆角/间距） */}
        <div className="flex items-center justify-end gap-4 min-w-0" data-table-row-trigger="ignore">
          <label className="flex items-center gap-1 shrink-0">
            <span className="text-gray-500">每页</span>
            <select
              className="h-8 rounded-sm border border-gray-200 bg-white px-2 text-[13px] text-gray-700 hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={size}
              onChange={(e) => onPageSizeChange?.(parseInt(e.target.value, 10))}
            >
              {(pageSizeOptions ?? [10, 20, 50]).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span className="text-gray-500">条</span>
          </label>

          <div className="flex items-center gap-1">
            <span className="text-gray-500">跳到</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={raw}
              onChange={(e) => setRaw(e.target.value.replace(/[^\d]/g, ''))}
              onKeyDown={onKeyDown}
              onBlur={() => setRaw(String(parseToPage(raw) ?? current))}
              className="h-8 w-12 rounded-sm border border-gray-200 bg-white px-2 text-[13px] text-gray-700 hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-center tabular-nums"
              aria-label="输入页码并回车或点击确定跳转"
            />
            <span className="text-gray-500">页</span>
            <ActionLink tone='primary' size='xs' onClick={commit} disabled={parseToPage(raw) === current} aria-label="确定跳转">
              确定
            </ActionLink>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        className={cx(
          'grid-table relative max-h-full overflow-y-auto overflow-x-auto nice-scrollbar outline-none focus:outline-none',
          'bg-white border border-gray-200',
          hasLeftShadow && 'has-left-shadow',
          hasRightShadow && 'has-right-shadow',
          className
        )}
      >
        {/* 背景占位：撑起滚动高度（保持原有虚拟滚动结构，不做最小高度干预） */}
        <div className="w-auto" style={{ height: fullHeight }}>
          {/* 粘滞视图：三段布局 */}
          <div className="sticky min-w-full w-max top-0 grid grid-cols-[max-content_auto_max-content] gap-0 overflow-visible">
            <Region type="left" metas={metasLeft} template={templateLeft} />
            <Region type="center" metas={metasCenter} template={templateCenter} />
            <Region type="right" metas={metasRight} template={templateRight} />
          </div>
        </div>

{/* 空态覆盖层：顶级父容器的直接子元素；不遮住表头（从 headerHeight 开始） */}
        {showEmpty && (
          <div
            className="absolute z-[150] left-0 right-0 bottom-0 flex items-center justify-center p-6"
            style={{ top: headerHeight }}
            role="status"
            aria-live="polite"
          >
            {emptyNode}
          </div>
        )}

        {showLoading && <LoadingOverlay text={loadingState} />}
      </div>

      {/* 轻量分页条（不改变表格主体样式） */}
      {hasPagination && <PaginationBar />}
    </>
  );
}
