'use client';

import type {
  CSSProperties,
  ReactNode,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent as ReactKeyboardEvent, // 新增：键盘事件类型
} from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from './Checkbox';

type FixedSide = 'left' | 'right';

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
  minWidth?: number;
  maxWidth?: number;
  width?: number | string; // 未设置时按“auto”参与模板
  render?: (row: T, context: GridCellRenderContext<T>) => ReactNode;
  tooltip?: (row: T) => string;
  className?: string;
  headerClassName?: string;
  intent?: 'data' | 'actions' | 'status' | 'meta';
  semantic?: 'text' | 'number' | 'integer' | 'currency' | 'percent' | 'date' | 'time' | 'datetime';
  hidden?: boolean;
  fixed?: FixedSide; // 若未显式设置且 intent=actions，则默认走 right 固定区
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
  columnWidth?: number; // 左侧选择列宽
};

type RowItem<T> = {
  row: T;
  key: string | number;
  index: number;
  selectable: boolean;
};

type GridTableProps<T> = {
  columns: Array<GridColumn<T>>;
  data: T[];
  rowHeight?: number;
  headerHeight?: number;
  overscan?: number;
  zebra?: boolean;
  highlightOnHover?: boolean;
  rowKey?: (row: T, index: number) => string | number;
  className?: string;
  emptyState?: ReactNode;
  loading?: boolean;
  loadingState?: ReactNode;
  selection?: GridSelection<T>;
  onRowClick?: (row: T, context: GridCellRenderContext<T>, event: ReactMouseEvent<HTMLDivElement>) => void;
  onRowDoubleClick?: (row: T, context: GridCellRenderContext<T>, event: ReactMouseEvent<HTMLDivElement>) => void;
};

type ColumnMeta<T> = {
  column: GridColumn<T>;
  width: number;
  align: 'left' | 'center' | 'right';
  textAlignClass: string;
  justifyClass: string;
  semanticClass: string;
};

const MIN_COLUMN_WIDTH = 96;

// 与 Table 组件一致的行态色
const ZEBRA_EVEN_COLOR = '#ffffff';
const ZEBRA_ODD_COLOR = '#f8fafc';
const HOVER_COLOR = '#f3f4f6';
const SELECTED_COLOR = 'rgba(30, 128, 255, 0.12)';
const SELECTED_HOVER_COLOR = 'rgba(30, 128, 255, 0.18)';

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function shouldIgnoreRowToggle(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('button, a, [role="button"], input, label, [data-table-row-trigger="ignore"]'));
}

// ===== 语义列/对齐规则：参考 Table 组件 =====
function resolveAlign<T>(col: GridColumn<T>): 'left' | 'center' | 'right' {
  if (col.intent === 'actions') return 'center';
  if (col.align) return col.align;
  switch (col.semantic) {
    case 'number':
    case 'integer':
    case 'currency':
    case 'percent':
      return 'right';
    case 'date':
    case 'time':
    case 'datetime':
      return 'center';
    default:
      return 'left';
  }
}

function getSemanticClass<T>(col: GridColumn<T>): string {
  switch (col.semantic) {
    case 'number':
    case 'integer':
    case 'currency':
    case 'percent':
    case 'date':
    case 'time':
    case 'datetime':
      return 'tabular-nums';
    default:
      return '';
  }
}

function parsePx(input: string): number | null {
  const m = input.trim().match(/^([0-9]+(?:\.[0-9]+)?)px$/i);
  return m ? parseFloat(m[1]) : null;
}

function resolveColumnWidth<T>(col: GridColumn<T>): number {
  if (typeof col.width === 'number') return col.width;
  if (typeof col.width === 'string') {
    const px = parsePx(col.width);
    if (px != null) return px;
  }
  if (typeof col.minWidth === 'number') return col.minWidth;
  if (typeof col.maxWidth === 'number') return col.maxWidth;
  return MIN_COLUMN_WIDTH;
}

function buildTemplate<T>(metas: ColumnMeta<T>[]): string {
  return metas
    .map((meta) => {
      const col = meta.column;
      const isSelection = col.key === '__selection__';
      const hasExplicit =
        typeof col.width !== 'undefined' ||
        typeof col.minWidth === 'number' ||
        typeof col.maxWidth === 'number' ||
        isSelection;

      if (!hasExplicit) return 'auto';
      if (typeof col.width === 'number') return `${Math.max(col.width, MIN_COLUMN_WIDTH)}px`;
      if (typeof col.width === 'string') return col.width;
      return `${Math.max(meta.width, MIN_COLUMN_WIDTH)}px`;
    })
    .join(' ');
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
    width: resolveColumnWidth(col),
    align,
    textAlignClass: align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right',
    justifyClass: align === 'left' ? 'justify-start' : align === 'center' ? 'justify-center' : 'justify-end',
    semanticClass: getSemanticClass(col),
  };
}

export default function GridTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowHeight = 36,      // 和 Table 行高风格更接近
  headerHeight =33,    // header 留白更接近 Table
  overscan = 4,
  zebra = true,
  rowKey,
  className = '',
  emptyState,
  loading = false,
  loadingState,
  selection,
  onRowClick,
  onRowDoubleClick,
}: GridTableProps<T>) {
  // ==== 视窗度量（自适应高度；无 height prop） ====
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewHeight, setViewHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => setViewHeight(el.clientHeight);
    measure();

    let ro: ResizeObserver | null = null;
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => measure());
      ro.observe(el);
    }

    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      if (ro) ro.disconnect();
    };
  }, []);

  // ==== 数据准备 ====
  const rows: Array<RowItem<T>> = useMemo(
    () =>
      data.map((row, index) => {
        const key = resolveRowKey(row, index, rowKey);
        const selectable = selection ? (selection.isRowSelectable ? selection.isRowSelectable(row, index) : true) : true;
        return { row, key, index, selectable };
      }),
    [data, rowKey, selection]
  );

  // ==== 列切分（参考 Table：actions 默认右固定） ====
  const metasAll = useMemo(() => {
    const cols = columns
      .filter((c) => !c.hidden)
      .map<GridColumn<T>>((c) => {
        if (!c.fixed && c.intent === 'actions') return { ...c, fixed: 'right' };
        return c;
      })
      .map(makeMeta<T>);

    // 左侧选择列
    const metas: ColumnMeta<T>[] = selection
      ? [
          makeMeta<T>({
            key: '__selection__',
            title: selection.headerTitle ?? '',
            width: selection.columnWidth ?? 44,
            align: 'center',
            intent: 'meta',
            semantic: 'integer',
            fixed: 'left',
          } as GridColumn<T>),
          ...cols,
        ]
      : cols;

    return metas;
  }, [columns, selection]);

  const metasLeft = useMemo(() => metasAll.filter((m) => m.column.fixed === 'left'), [metasAll]);
  const metasRight = useMemo(() => metasAll.filter((m) => m.column.fixed === 'right'), [metasAll]);
  const metasCenter = useMemo(() => metasAll.filter((m) => !m.column.fixed), [metasAll]);

  const templateLeft = useMemo(() => buildTemplate(metasLeft), [metasLeft]);
  const templateCenter = useMemo(() => buildTemplate(metasCenter), [metasCenter]);
  const templateRight = useMemo(() => buildTemplate(metasRight), [metasRight]);

  // ==== 虚拟滚动计算 ====
  const fullHeight = useMemo(() => headerHeight + rowHeight * rows.length, [headerHeight, rowHeight, rows.length]);

  const visibleRows = useMemo(() => {
    if(viewHeight<headerHeight)
    {
        return [];
    }
    const visible = Math.max(viewHeight - headerHeight, 0);
    //先用总高度算出末尾索引
    const endIndex=Math.floor((scrollTop+visible)/ rowHeight)+1;
    const startIndex=Math.max(Math.floor(scrollTop/ rowHeight)-1,0);
    return rows.slice(startIndex, endIndex);

  }, [rows, scrollTop,viewHeight, headerHeight, rowHeight]);

  // ==== 选择/悬停/点击 ====
  const [hoverKey, setHoverKey] = useState<string | number | null>(null);
  const selectedSet = useMemo(() => new Set(selection?.selectedKeys ?? []), [selection?.selectedKeys]);

  // ==== 焦点行（内部，仅实现功能，不动样式） ====
  const [activeFocusKey, setActiveFocusKey] = useState<string | number | null>(null);

  // 数据变化时维持或回落到第一行
  useEffect(() => {
    if (rows.length === 0) {
      if (activeFocusKey !== null) setActiveFocusKey(null);
      return;
    }
    if (activeFocusKey != null && rows.some((r) => r.key === activeFocusKey)) return;
    setActiveFocusKey(rows[0]?.key ?? null);
  }, [rows, activeFocusKey]);

  const updateFocus = useCallback((key: string | number | null) => {
    setActiveFocusKey(key);
  }, []);

  const isRowSelectable = useCallback(
    (r: T, i: number) => (selection?.isRowSelectable ? selection.isRowSelectable(r, i) : true),
    [selection]
  );

  const selectableRows = useMemo(() => rows.filter((it) => it.selectable), [rows]);
  const allSelected =
    selection?.enableSelectAll &&
    selectableRows.length > 0 &&
    selectableRows.every((it) => selectedSet.has(it.key));
  const partiallySelected =
    selection?.enableSelectAll &&
    selectableRows.length > 0 &&
    !allSelected &&
    selectableRows.some((it) => selectedSet.has(it.key));

  const toggleAll = useCallback(() => {
    if (!selection || !selection.enableSelectAll) return;
    const every = selectableRows.every((it) => selectedSet.has(it.key));
    if (every) {
      selection.onChange([], []);
    } else {
      const keys = selectableRows.map((it) => it.key);
      const rowsSel = selectableRows.map((it) => it.row);
      selection.onChange(keys, rowsSel);
    }
  }, [selection, selectableRows, selectedSet]);

  const toggleOne = useCallback(
    (item: RowItem<T>) => {
      if (!selection || !item.selectable) return;
      const mode = selection.mode ?? 'multiple';
      if (mode === 'single') {
        selection.onChange([item.key], [item.row]);
      } else {
        const next = new Set(selection.selectedKeys ?? []);
        if (next.has(item.key)) next.delete(item.key);
        else next.add(item.key);
        const nextKeys = Array.from(next);
        const nextRows = rows.filter((r) => next.has(r.key)).map((r) => r.row);
        selection.onChange(nextKeys, nextRows);
      }
    },
    [selection, rows]
  );

  // 键盘控制焦点（↑ ↓ Home End；空格在有 selection 时切换选中）
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (rows.length === 0) return;
      const idx = activeFocusKey == null ? -1 : rows.findIndex((it) => it.key === activeFocusKey);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = idx < rows.length - 1 ? rows[idx + 1] : rows[rows.length - 1];
        updateFocus(next?.key ?? null);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = idx > 0 ? rows[idx - 1] : rows[0];
        updateFocus(prev?.key ?? null);
      } else if (e.key === 'Home') {
        e.preventDefault();
        updateFocus(rows[0]?.key ?? null);
      } else if (e.key === 'End') {
        e.preventDefault();
        updateFocus(rows[rows.length - 1]?.key ?? null);
      } else if ((e.key === ' ' || e.key === 'Spacebar') && selection && activeFocusKey != null) {
        e.preventDefault();
        const hit = rows.find((r) => r.key === activeFocusKey);
        if (hit) toggleOne(hit);
      }
    },
    [rows, activeFocusKey, selection, toggleOne, updateFocus]
  );

  const onRowClickInternal = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>, item: RowItem<T>) => {
      const isSelected = selectedSet.has(item.key);
      const ctx: GridCellRenderContext<T> = {
        row: item.row,
        rowIndex: item.index,
        key: item.key,
        isSelected,
        isHovered: hoverKey === item.key,
      };

      if (selection?.selectOnRowClick && !shouldIgnoreRowToggle(e.target)) {
        toggleOne(item);
      }
      onRowClick?.(item.row, ctx, e);
    },
    [hoverKey, onRowClick, selection?.selectOnRowClick, selectedSet, toggleOne]
  );

  const onRowDoubleClickInternal = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>, item: RowItem<T>) => {
      const isSelected = selectedSet.has(item.key);
      const ctx: GridCellRenderContext<T> = {
        row: item.row,
        rowIndex: item.index,
        key: item.key,
        isSelected,
        isHovered: hoverKey === item.key,
      };
      onRowDoubleClick?.(item.row, ctx, e);
    },
    [hoverKey, onRowDoubleClick, selectedSet]
  );

  // ==== 渲染工具（不改样式） ====
  const headerCellBase = 'px-4 py-3 text-xs font-medium text-gray-600';
  const bodyCellBase = 'px-4 py-3 text-sm text-gray-900';
  const headerRowClass = 'bg-gray-50 text-gray-600 sticky top-0 z-10 border-b border-gray-200';

  const renderHeaderCells = (metas: ColumnMeta<T>[]) =>
    metas.map((m) => {
      const isSelection = m.column.key === '__selection__';
      const justifyClass = m.justifyClass.replace('justify-', '');
      return (
        <div
          key={`h-${String(m.column.key)}`}
          className={cx(
            'border-b border-gray-200 bg-gray-50',
            headerCellBase,
            m.textAlignClass,
            m.semanticClass,
            m.column.headerClassName
          )}
          style={{ height: headerHeight }}
        >
          {isSelection ? (
            selection?.enableSelectAll ? (
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={Boolean(allSelected)}
                  aria-checked={partiallySelected ? 'mixed' : allSelected ? 'true' : 'false'}
                  aria-label={selection?.headerTitle ?? '全选'}
                  onChange={toggleAll}
                />
              </div>
            ) : (
              <span className="sr-only">选择</span>
            )
          ) : (
            <span className="truncate">{m.column.title}</span>
          )}
        </div>
      );
    });

  const cellBgColor = (item: RowItem<T>, isSelected: boolean, isHovered: boolean) => {
    const base = zebra ? (item.index % 2 === 0 ? ZEBRA_EVEN_COLOR : ZEBRA_ODD_COLOR) : ZEBRA_EVEN_COLOR;
    if (isSelected) return isHovered ? SELECTED_HOVER_COLOR : SELECTED_COLOR;
    return isHovered ? HOVER_COLOR : base;
  };

  const renderBodyCells = (metas: ColumnMeta<T>[], item: RowItem<T>) =>
    metas.map((m) => {
      const isSelection = m.column.key === '__selection__';
      const isSelected = selectedSet.has(item.key);
      const isHovered = hoverKey === item.key;
      const bg = cellBgColor(item, isSelected, isHovered);

      const commonProps = {
        className: cx('overflow-hidden whitespace-nowrap', bodyCellBase, m.textAlignClass, m.semanticClass, m.column.className),
        style: { height: rowHeight, backgroundColor: bg } as CSSProperties,
        onMouseEnter: () => setHoverKey(item.key),
        onMouseLeave: () => setHoverKey((k) => (k === item.key ? null : k)),
        title: m.column.tooltip ? m.column.tooltip(item.row) : undefined,
      };

      if (isSelection) {
        return (
          <div key={`b-${String(m.column.key)}-${String(item.key)}`} {...commonProps}>
            <div className="flex items-center justify-center">
              <Checkbox
                checked={isSelected}
                disabled={!item.selectable}
                onChange={() => toggleOne(item)}
                aria-label="选择行"
              />
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

      const value =
        typeof m.column.render === 'function'
          ? m.column.render(item.row, ctx)
          : (item.row[m.column.key as keyof T] as ReactNode);

      const contentClass =
        m.column.intent === 'actions'
          ? 'flex items-center justify-center gap-2 whitespace-nowrap'
          : m.column.intent === 'status'
          ? 'flex items-center gap-2'
          : m.align === 'right'
          ? 'flex items-center justify-end gap-2'
          : m.align === 'center'
          ? 'flex items-center justify-center gap-2'
          : 'truncate';

      return (
        <div key={`b-${String(m.column.key)}-${String(item.key)}`} {...commonProps}>
          <div className={contentClass}>{value}</div>
        </div>
      );
    });

// === Region 组件（不动结构样式，仅加焦点） ===
const Region: React.FC<{
  metas: ColumnMeta<T>[];
  type:'left'|'center'|'right';
  template: string;
}> = ({ metas, template,type }) => {
    let index=0;
    if(type==='center')
    {
        index=99;
    }
    else
    {
        index=100;
    }
    return (
        <div className={
            cx(
                "w-auto grid gap-0 overflow-visible",
                type!=='center'?"sticky border-gray-200":"",
                type==='left'?"left-0":"right-0",type==='left'?"border-r":"",
                type==='right'?"border-l":""
            )
        } style={{ gridTemplateColumns: template,zIndex:index }}>
            {/* 标题单元格（必须在开头） */}
            {metas.map((m) => {
                const isSelection = m.column.key === '__selection__';
                return (
                    <div
                        key={`h-${String(m.column.key)}`}
                        className={cx(
                            'sticky top-0 border-b border-gray-200 bg-gray-50 whitespace-nowrap',
                            type==='center'?"min-w-full":"",
                            'px-2 py-2 text-xs font-medium text-gray-600',
                            m.textAlignClass,
                            m.semanticClass,
                            m.column.headerClassName
                        )}
                        style={{ height: headerHeight }}
                    >
                        {isSelection ? (
                            selection?.enableSelectAll ? (
                                <div className="flex items-center justify-center">
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
                                            else
                                                selection.onChange(
                                                    selectable.map((it) => it.key),
                                                    selectable.map((it) => it.row)
                                                );
                                        }}
                                    />
                                </div>
                            ) : (
                                <span className="sr-only">选择</span>
                            )
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
                    const isSelected = selectedSet.has(item.key);
                    const isHovered = hoverKey === item.key;
                    const isFocused = activeFocusKey != null && activeFocusKey === item.key; // 焦点标记
                    const bgBase = zebra ? (item.index % 2 === 0 ? '#ffffff' : '#f8fafc') : '#ffffff';
                    const bg = isSelected ? (isHovered ? 'rgba(30,128,255,0.18)' : 'rgba(30,128,255,0.12)') : isHovered ? '#f3f4f6' : bgBase;

                    const commonProps = {
                        className: cx(
                            'overflow-hidden whitespace-nowrap',
                            'px-2 py-2 text-sm text-gray-900',
                            m.textAlignClass,
                            m.semanticClass,
                            m.column.className
                        ),
                        style: {
                            height: rowHeight,
                            backgroundColor: bg,
                        } as CSSProperties,
                        'data-focused': isFocused ? 'true' : undefined, // 仅打标，不加样式
                        onMouseEnter: () => setHoverKey(item.key),
                        onMouseLeave: () => setHoverKey((k) => (k === item.key ? null : k)),
                        title: m.column.tooltip ? m.column.tooltip(item.row) : undefined,
                        onClick: (e: ReactMouseEvent<HTMLDivElement>) => {
                            updateFocus(item.key); // 点击即设为焦点
                            const ctx: GridCellRenderContext<T> = {
                                row: item.row,
                                rowIndex: item.index,
                                key: item.key,
                                isSelected,
                                isHovered,
                            };
                            if (selection?.selectOnRowClick && !shouldIgnoreRowToggle(e.target)) {
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
                    };

                    if (isSelection) {
                        return (
                            <div key={`b-${String(m.column.key)}-${String(item.key)}`} {...commonProps}>
                                <div className="flex items-center justify-center">
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
                    const value =
                        typeof m.column.render === 'function'
                            ? m.column.render(item.row, ctx)
                            : (item.row[m.column.key as keyof T] as ReactNode);

                    const contentClass =
                        m.column.intent === 'actions'
                            ? 'flex items-center justify-center gap-2 whitespace-nowrap'
                            : m.column.intent === 'status'
                                ? 'flex items-center gap-2'
                                : m.align === 'right'
                                    ? 'flex items-center justify-end gap-2'
                                    : m.align === 'center'
                                        ? 'flex items-center justify-center gap-2'
                                        : 'truncate';

                    return (
                        <div key={`b-${String(m.column.key)}-${String(item.key)}`} {...commonProps}>
                            <div className={contentClass}>{value}</div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

  const showEmpty = !loading && rows.length === 0;
  const showLoading = loading;

  return (
    <div
      ref={containerRef}
      tabIndex={0}                 // 允许接收键盘事件
      onKeyDown={handleKeyDown}    // 焦点行键盘控制
      className={cx(
        'relative max-h-full overflow-y-auto overflow-x-auto nice-scrollbar outline-none focus:outline-none',
        'bg-white border border-gray-200',
        className,
      )}
    >
      {/* 背景占位：撑起真实滚动高度 */}
      <div className='w-auto' style={{ height: fullHeight }} >

        {/* 粘滞视图：三段布局 */}
       <div className="sticky w-max top-0 grid grid-cols-[max-content_auto_max-content] gap-0 overflow-visible">
          {/* 左：固定列（含选择列）不滚动水平条 */}
          <Region type='left' metas={metasLeft} template={templateLeft}  />
          {/* 中：未固定列，可水平滚动 */}
          <Region type='center' metas={metasCenter} template={templateCenter} />
          {/* 右：固定列（默认 actions） */}
          <Region type='right' metas={metasRight} template={templateRight} />
        </div>
      </div>

      {/* 空/加载（保持你原有样式） */}
      {(showEmpty || showLoading) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="px-3 py-2 text-gray-500 bg-white/80">
            {showLoading ? loadingState ?? '加载中…' : emptyState ?? '暂无数据'}
          </div>
        </div>
      )}
    </div>
  );
}
