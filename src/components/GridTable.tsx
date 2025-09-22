'use client';

import type {
  CSSProperties,
  ReactNode,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
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

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function shouldIgnoreRowToggle(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('button, a, [role="button"], input, label, [data-table-row-trigger="ignore"]'));
}

// ---- 从 CSS 变量读取样式数值（替代文件内样式常量） ----
function cssNumber(varName: string, fallback: number) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName);
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

const MIN_COLUMN_WIDTH = cssNumber('--gt-min-col-w', 96); // 仅数值，来源于 globals.css

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
  return MIN_COLUMN_WIDTH; // 默认值：来自 CSS 变量
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
  rowHeight = cssNumber('--gt-row-h', 36),
  headerHeight = cssNumber('--gt-header-h', 33),
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
  // ==== 视窗度量 ====
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewHeight, setViewHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // 横向阴影开关（仅样式）
  const [hasLeftShadow, setHasLeftShadow] = useState(false);
  const [hasRightShadow, setHasRightShadow] = useState(false);

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

    const onScrollOrResize = () => {
      setScrollTop(el.scrollTop);
      const { scrollLeft, clientWidth, scrollWidth } = el;
      setHasLeftShadow(scrollLeft > 0);
      setHasRightShadow(scrollLeft + clientWidth < scrollWidth - 1);
    };
    el.addEventListener('scroll', onScrollOrResize, { passive: true });
    onScrollOrResize(); // 初始化判断一次

    return () => {
      el.removeEventListener('scroll', onScrollOrResize);
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

  // ==== 可见切片（保留你现有的简单实现，不引入 overscan） ====
  const fullHeight = useMemo(() => headerHeight + rowHeight * rows.length, [headerHeight, rowHeight, rows.length]);

  const visibleRows = useMemo(() => {
    if (viewHeight < headerHeight) return [];
    const visible = Math.max(viewHeight - headerHeight, 0);
    const endIndex = Math.floor((scrollTop + visible) / rowHeight) + 1;
    const startIndex = Math.max(Math.floor(scrollTop / rowHeight) - 1, 0);
    return rows.slice(startIndex, endIndex);
  }, [rows, scrollTop, viewHeight, headerHeight, rowHeight]);

  // ==== 选择/悬停/点击 ====
  const [hoverKey, setHoverKey] = useState<string | number | null>(null);
  const selectedSet = useMemo(() => new Set(selection?.selectedKeys ?? []), [selection?.selectedKeys]);

  // ==== 焦点行（内部，仅实现功能，不动样式） ====
  const [activeFocusKey, setActiveFocusKey] = useState<string | number | null>(null);

  useEffect(() => {
    if (rows.length === 0) {
      if (activeFocusKey !== null) setActiveFocusKey(null);
      return;
    }
    if (activeFocusKey != null && rows.some((r) => r.key === activeFocusKey)) return;
    setActiveFocusKey(rows[0]?.key ?? null);
  }, [rows, activeFocusKey]);

  const updateFocus = useCallback((key: string | number | null) => setActiveFocusKey(key), []);

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

  // 键盘控制焦点
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

  // === Region 组件（结构不动，仅补样式类 & 颜色改为 CSS 变量） ===
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
          type === 'left' ? 'left-0 border-r gt-region--left' : type === 'right' ? 'right-0 border-l gt-region--right' : 'gt-region--center'
        )}
        style={{ gridTemplateColumns: template, zIndex }}
      >
        {/* 标题单元格 */}
        {metas.map((m) => {
          const isSelection = m.column.key === '__selection__';
          return (
            <div
              key={`h-${String(m.column.key)}`}
              className={cx(
                'gt-head-cell sticky top-0 border-b border-gray-200 bg-gray-50 whitespace-nowrap',
                type === 'center' ? 'min-w-full' : '',
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
                        else selection.onChange(selectable.map((it) => it.key), selectable.map((it) => it.row));
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
            const isFocused = activeFocusKey != null && activeFocusKey === item.key;

            // 颜色全部来自 CSS 变量
            const base = zebra ? (item.index % 2 === 0 ? 'var(--gt-zebra-even)' : 'var(--gt-zebra-odd)') : 'var(--gt-zebra-even)';
            const bg = isSelected ? (isHovered ? 'var(--gt-selected-hover)' : 'var(--gt-selected)') : isHovered ? 'var(--gt-hover)' : base;

            const commonProps = {
              className: cx(
                'gt-cell overflow-hidden whitespace-nowrap',
                'px-2 py-2 text-sm text-gray-900',
                m.textAlignClass,
                m.semanticClass,
                m.column.className
              ),
              style: {
                height: rowHeight,
                backgroundColor: bg,
              } as CSSProperties,
              'data-focused': isFocused ? 'true' : undefined,
              onMouseEnter: () => setHoverKey(item.key),
              onMouseLeave: () => setHoverKey((k) => (k === item.key ? null : k)),
              title: m.column.tooltip ? m.column.tooltip(item.row) : undefined,
              onClick: (e: ReactMouseEvent<HTMLDivElement>) => {
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
            } as const;

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


            return (
              <div key={`b-${String(m.column.key)}-${String(item.key)}`} {...commonProps}>
                <div className='truncate'>{value}</div>
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
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cx(
        // 注意：加上 grid-table & 阴影开关类（仅样式）
        'grid-table relative max-h-full overflow-y-auto overflow-x-auto nice-scrollbar outline-none focus:outline-none',
        'bg-white border border-gray-200',
        hasLeftShadow && 'has-left-shadow',
        hasRightShadow && 'has-right-shadow',
        className,
      )}
    >
      {/* 背景占位：撑起真实滚动高度 */}
      <div className="w-auto" style={{ height: fullHeight }}>
        {/* 粘滞视图：三段布局（不改你的结构） */}
        <div className="sticky w-max top-0 grid grid-cols-[max-content_auto_max-content] gap-0 overflow-visible">
          <Region type="left" metas={metasLeft} template={templateLeft} />
          <Region type="center" metas={metasCenter} template={templateCenter} />
          <Region type="right" metas={metasRight} template={templateRight} />
        </div>
      </div>

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
