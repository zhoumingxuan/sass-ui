'use client';

import type { CSSProperties, ReactNode, MouseEvent as ReactMouseEvent } from 'react';
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
  flex?: number; // 仅用于推导宽度上限（模板仍输出固定px）
  render?: (row: T, context: GridCellRenderContext<T>) => ReactNode;
  tooltip?: (row: T) => string;
  className?: string;
  headerClassName?: string;
  intent?: 'data' | 'actions' | 'status' | 'meta';
  semantic?: 'text' | 'number' | 'integer' | 'currency' | 'percent' | 'date' | 'time' | 'datetime';
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

type ScrollSnapshot = {
  scrollTop: number;
  scrollLeft: number;
  viewportHeight: number;
  viewportWidth: number;
  scrollWidth: number;
  scrollHeight: number;
};

type RowItem<T> = {
  row: T;
  key: string | number;
  index: number;
};

type GridTableProps<T> = {
  columns: Array<GridColumn<T>>;
  data: T[];
  height?: number;
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
  rowClassName?: (row: T, index: number, key: string | number) => string;
  rowStyle?: (row: T, index: number, key: string | number) => CSSProperties | undefined;
};

type ColumnMeta<T> = {
  column: GridColumn<T>;
  width: number; // 推导宽度（用于最小/内容宽度计算）
  align: 'left' | 'center' | 'right';
  textAlignClass: string;
  justifyClass: string;
  semanticClass: string;
};

const MIN_COLUMN_WIDTH = 96;
const GRID_GAP = 8; // 列间距（px）
const ZEBRA_EVEN_COLOR = '#ffffff';
const ZEBRA_ODD_COLOR = '#f8fafc';
const HOVER_COLOR = '#f2f5ff';
const SELECTED_COLOR = 'rgba(30, 128, 255, 0.12)';
const SELECTED_HOVER_COLOR = 'rgba(30, 128, 255, 0.18)';

function shouldIgnoreRowToggle(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('button, a, [role="button"], input, label, [data-table-row-trigger="ignore"]'));
}

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
  // 仅用于布局最小宽度与内容宽度估算，不直接决定模板（模板见 buildTemplate）
  if (typeof col.width === 'number') return col.width;
  if (typeof col.width === 'string') {
    const px = parsePx(col.width);
    if (px != null) return px;
  }
  if (typeof col.minWidth === 'number') return col.minWidth;
  if (typeof col.maxWidth === 'number') return col.maxWidth;
  if (typeof col.flex === 'number') return Math.max(col.flex * 160, MIN_COLUMN_WIDTH);
  return MIN_COLUMN_WIDTH; // 未设置宽时，推导用最小值，模板仍会输出 auto
}

function buildTemplate<T>(metas: ColumnMeta<T>[]): string {
  // 规则：若列未设置 width/minWidth/maxWidth/flex => 使用 'auto'；否则使用像素宽度
  return metas
    .map((meta) => {
      const col = meta.column;
      const hasExplicit =
        typeof col.width !== 'undefined' ||
        typeof col.minWidth === 'number' ||
        typeof col.maxWidth === 'number' ||
        typeof col.flex === 'number' ||
        col.key === '__selection__';
      if (!hasExplicit) return 'auto';

      if (typeof col.width === 'number') return `${Math.max(col.width, MIN_COLUMN_WIDTH)}px`;
      if (typeof col.width === 'string') return col.width; // 允许自定义单位
      return `${Math.max(meta.width, MIN_COLUMN_WIDTH)}px`;
    })
    .join(' ');
}

function resolveRowKey<T>(row: T, index: number, fallback?: GridTableProps<T>['rowKey']): string | number {
  if (fallback) return fallback(row, index);
  const fromId = (row as { id?: string | number })?.id;
  if (typeof fromId !== 'undefined') return fromId;
  const fromKey = (row as { key?: string | number })?.key;
  if (typeof fromKey !== 'undefined') return fromKey;
  return index;
}

export default function GridTable<T extends Record<string, unknown>>({
  columns,
  data,
  height = 440,
  rowHeight = 48,
  headerHeight = 48,
  overscan = 4,
  zebra = true,
  highlightOnHover = true,
  rowKey,
  className = '',
  emptyState,
  loading = false,
  loadingState,
  selection,
  onRowClick,
  onRowDoubleClick,
  rowClassName,
  rowStyle,
}: GridTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<ScrollSnapshot>({
    scrollTop: 0,
    scrollLeft: 0,
    viewportHeight: height,
    viewportWidth: 0,
    scrollWidth: 0,
    scrollHeight: 0,
  });
  const [hoveredRowKey, setHoveredRowKey] = useState<string | number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let frame = 0;
    const readSnapshot = () => {
      frame = 0;
      setScrollState({
        scrollTop: el.scrollTop,
        scrollLeft: el.scrollLeft,
        viewportHeight: el.clientHeight,
        viewportWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight,
      });
    };
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(readSnapshot);
    };

    readSnapshot();
    el.addEventListener('scroll', schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', schedule);
      if (frame) window.cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [columns.length, data.length, height]);

  const visibleColumns = useMemo(() => columns.filter((c) => !c.hidden), [columns]);

  const columnMeta = useMemo<ColumnMeta<T>[]>(() => {
    return visibleColumns.map((col) => {
      const align = resolveAlign(col);
      return {
        column: col,
        width: resolveColumnWidth(col),
        align,
        textAlignClass: align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
        justifyClass: align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start',
        semanticClass: getSemanticClass(col),
      };
    });
  }, [visibleColumns]);

  const selectionMode = selection?.mode ?? 'multiple';
  const selectOnRowClick = selection?.selectOnRowClick ?? false;
  const enableSelectAll = selection?.enableSelectAll ?? true;
  const selectionColumnWidth = selection ? Math.max(selection.columnWidth ?? 56, 44) : 0;

  const selectionMeta = useMemo<ColumnMeta<T> | null>(() => {
    if (!selection) return null;
    return {
      column: {
        key: '__selection__',
        title: selection.headerTitle ?? '选择',
        align: 'center',
        fixed: 'left',
        intent: 'meta',
      } as GridColumn<T>,
      width: selectionColumnWidth,
      align: 'center',
      textAlignClass: 'text-center',
      justifyClass: 'justify-center',
      semanticClass: '',
    };
  }, [selection, selectionColumnWidth]);

  // —— 切分 Left / Center / Right ——
  const leftMeta = useMemo(() => {
    const fixed = columnMeta.filter((m) => m.column.fixed === 'left');
    return selectionMeta ? [selectionMeta, ...fixed] : fixed;
  }, [columnMeta, selectionMeta]);
  const rightMeta = useMemo(() => columnMeta.filter((m) => m.column.fixed === 'right'), [columnMeta]);
  const centerMeta = useMemo(
    () => columnMeta.filter((m) => m.column.fixed !== 'left' && m.column.fixed !== 'right'),
    [columnMeta],
  );

  // —— 统一模板：标题、内容共享；未设置宽 => auto ——
  const leftWidth = useMemo(() => leftMeta.reduce((s, m) => s + m.width, 0), [leftMeta]);
  const rightWidth = useMemo(() => rightMeta.reduce((s, m) => s + m.width, 0), [rightMeta]);
  const centerWidth = useMemo(() => centerMeta.reduce((s, m) => s + m.width, 0), [centerMeta]);

  const leftTemplate = leftMeta.length > 0 ? buildTemplate(leftMeta) : '';
  const centerTemplate = centerMeta.length > 0 ? buildTemplate(centerMeta) : `minmax(${MIN_COLUMN_WIDTH}px, 1fr)`;
  const rightTemplate = rightMeta.length > 0 ? buildTemplate(rightMeta) : '';

  const templates = useMemo(() => ({ left: leftTemplate, center: centerTemplate, right: rightTemplate }), [leftTemplate, centerTemplate, rightTemplate]);

  const centerMinWidth = centerMeta.length > 0 ? Math.max(centerWidth, centerMeta.length * MIN_COLUMN_WIDTH) : 0;
  const contentWidth = Math.max(leftWidth + centerWidth + rightWidth, scrollState.viewportWidth || 0, 320);

  // —— Row key & 数据 ——
  const getRowKey = useCallback((row: T, index: number) => resolveRowKey(row, index, rowKey), [rowKey]);
  const keyedRows = useMemo<RowItem<T>[]>(() => data.map((row, i) => ({ row, key: getRowKey(row, i), index: i })), [data, getRowKey]);

  useEffect(() => {
    if (hoveredRowKey === null) return;
    if (!keyedRows.some((it) => it.key === hoveredRowKey)) setHoveredRowKey(null);
  }, [hoveredRowKey, keyedRows]);

  // —— 虚拟滚动 ——
  const totalRows = keyedRows.length;
  const viewportHeight = scrollState.viewportHeight || height;
  const bodyViewportHeight = Math.max(0, viewportHeight - headerHeight);
  const fallbackBodyHeight = Math.max(bodyViewportHeight || height - headerHeight, rowHeight);
  const bodyScrollTop = Math.max(0, scrollState.scrollTop - headerHeight);
  const baseVisibleCount = bodyViewportHeight > 0 ? Math.ceil(bodyViewportHeight / rowHeight) : overscan;
  const startIndex = Math.max(0, Math.floor(bodyScrollTop / rowHeight) - overscan);
  const endIndex = Math.min(totalRows, startIndex + baseVisibleCount + overscan * 2);
  const offsetY = startIndex * rowHeight;

  const rowsToRender = useMemo(() => keyedRows.slice(startIndex, endIndex), [keyedRows, startIndex, endIndex]);

  const showLeftShadow = leftMeta.length > 0 && scrollState.scrollLeft > 0;
  const maxHorizontalScroll = Math.max(scrollState.scrollWidth - (scrollState.viewportWidth || 0), 0);
  const showRightShadow = rightMeta.length > 0 && scrollState.scrollLeft < maxHorizontalScroll - 1;

  const emptyContent = emptyState ?? <div className="py-16 text-center text-sm text-gray-500">暂无数据</div>;

  // —— 选择 ——
  const selectedKeySet = useMemo(() => new Set<string | number>(selection?.selectedKeys ?? []), [selection?.selectedKeys]);
  const selectableRows = useMemo(() => {
    if (!selection) return [] as RowItem<T>[];
    const can = selection.isRowSelectable ?? (() => true);
    return keyedRows.filter((it) => can(it.row, it.index));
  }, [keyedRows, selection]);
  const totalSelectable = selection ? selectableRows.length : 0;
  const selectedSelectableCount = selection ? selectableRows.reduce((c, it) => (selectedKeySet.has(it.key) ? c + 1 : c), 0) : 0;
  const allSelectableChecked = Boolean(selection) && totalSelectable > 0 && selectedSelectableCount === totalSelectable;
  const partiallySelected = Boolean(selection) && selectedSelectableCount > 0 && selectedSelectableCount < totalSelectable;
  const selectionHeaderDisabled = !selection || totalSelectable === 0;

  const toggleAllSelection = () => {
    if (!selection || selectionMode === 'single') return;
    if (allSelectableChecked) selection.onChange([], []);
    else selection.onChange(selectableRows.map((i) => i.key), selectableRows.map((i) => i.row));
  };

  const toggleRowSelection = (item: RowItem<T>) => {
    if (!selection) return;
    const can = selection.isRowSelectable ? selection.isRowSelectable(item.row, item.index) : true;
    if (!can) return;
    if (selectionMode === 'single') {
      selection.onChange([item.key], [item.row]);
      return;
    }
    const current = new Set(selection.selectedKeys);
    current.has(item.key) ? current.delete(item.key) : current.add(item.key);
    const nextKeys: Array<string | number> = [];
    const nextRows: T[] = [];
    for (const it of keyedRows) if (current.has(it.key)) { nextKeys.push(it.key); nextRows.push(it.row); }
    selection.onChange(nextKeys, nextRows);
  };

  const renderHeaderCells = (metas: ColumnMeta<T>[]) => metas.map((meta) => {
    const col = meta.column;
    const key = String(col.key);
    if (selection && key === '__selection__') {
      return (
        <div key={key} className="flex h-full items-center justify-center px-3 text-xs font-medium text-gray-600" title={selection.headerTitle}>
          {selectionMode === 'multiple' && enableSelectAll ? (
            <Checkbox checked={allSelectableChecked} indeterminate={partiallySelected} disabled={selectionHeaderDisabled} onChange={toggleAllSelection} />
          ) : (
            <span className="truncate text-xs text-gray-400">{selection.headerTitle ?? ''}</span>
          )}
        </div>
      );
    }
    return (
      <div key={key} className={`flex h-full items-center px-4 text-xs font-medium text-gray-600 ${meta.justifyClass} ${col.headerClassName ?? ''}`.trim()} title={typeof col.title === 'string' ? col.title : undefined}>
        <span className={`truncate ${meta.textAlignClass}`}>{col.title}</span>
      </div>
    );
  });

  const renderBodyCells = (metas: ColumnMeta<T>[], item: RowItem<T>, rowBackground: string, context: GridCellRenderContext<T>) => metas.map((meta) => {
    const col = meta.column;
    const key = String(col.key);
    const stickyStyle: CSSProperties | undefined = col.fixed === 'left' || col.fixed === 'right' ? { backgroundColor: rowBackground } : undefined;
    if (selection && key === '__selection__') {
      const can = selection.isRowSelectable ? selection.isRowSelectable(item.row, item.index) : true;
      return (
        <div key={key} className="flex h-full items-center justify-center px-3" style={stickyStyle}>
          <Checkbox checked={context.isSelected} disabled={!can} onChange={() => toggleRowSelection(item)} />
        </div>
      );
    }
    const value = col.render ? col.render(item.row, context) : (item.row[col.key as keyof T] as ReactNode);
    const titleValue = col.tooltip ? col.tooltip(item.row) : typeof value === 'string' ? value : undefined;
    const intentClass =
      col.intent === 'actions' ? 'flex items-center justify-center gap-2 whitespace-nowrap' :
      col.intent === 'status' ? 'flex items-center gap-2' :
      col.semantic === 'number' || col.semantic === 'integer' || col.semantic === 'currency' || col.semantic === 'percent' ? 'flex items-center justify-end gap-2' :
      col.semantic === 'date' || col.semantic === 'time' || col.semantic === 'datetime' ? 'flex items-center justify-center gap-2' : 'truncate';
    return (
      <div key={key} data-semantic={col.semantic ?? undefined} className={`px-4 py-3 text-sm text-gray-900 ${meta.textAlignClass} ${meta.semanticClass} ${col.className ?? ''}`.trim()} title={titleValue} style={stickyStyle}>
        <div className={intentClass}>{value}</div>
      </div>
    );
  });

  const renderRow = (item: RowItem<T>) => {
    const isHovered = highlightOnHover && hoveredRowKey === item.key;
    const isSelected = selection ? selectedKeySet.has(item.key) : false;
    const customRowStyle = rowStyle ? rowStyle(item.row, item.index, item.key) : undefined;
    const baseColor = zebra ? (item.index % 2 === 0 ? ZEBRA_EVEN_COLOR : ZEBRA_ODD_COLOR) : ZEBRA_EVEN_COLOR;
    const derivedBackground = selection && isSelected ? (isHovered ? SELECTED_HOVER_COLOR : SELECTED_COLOR) : isHovered ? HOVER_COLOR : baseColor;
    const rowBackground = customRowStyle && typeof customRowStyle.backgroundColor !== 'undefined' ? (customRowStyle.backgroundColor as string) : derivedBackground;

    const context: GridCellRenderContext<T> = { row: item.row, rowIndex: item.index, key: item.key, isSelected, isHovered };
    const interactive = (selection && selectOnRowClick) || typeof onRowClick === 'function';
    const rowClasses = ['relative flex border-b border-gray-100 transition-colors', interactive ? 'cursor-pointer' : '', rowClassName ? rowClassName(item.row, item.index, item.key) : ''].filter(Boolean).join(' ');
    const inlineStyle: CSSProperties = { height: rowHeight, backgroundColor: rowBackground, ...(customRowStyle ?? {}) };

    return (
      <div
        key={item.key}
        className={rowClasses}
        role="row"
        aria-selected={selection ? isSelected : undefined}
        style={inlineStyle}
        onMouseEnter={() => setHoveredRowKey(item.key)}
        onMouseLeave={() => setHoveredRowKey((cur) => (cur === item.key ? null : cur))}
        onClick={(event) => {
          if (selection && selectOnRowClick && !shouldIgnoreRowToggle(event.target)) toggleRowSelection(item);
          onRowClick?.(item.row, context, event);
        }}
        onDoubleClick={(event) => onRowDoubleClick?.(item.row, context, event)}
      >
        {leftMeta.length > 0 ? (
          <div className="sticky left-0 z-20 flex-shrink-0 border-r border-gray-100" style={{ width: leftWidth, backgroundColor: rowBackground }}>
            <div className="grid h-full" style={{ gridTemplateColumns: templates.left, columnGap: GRID_GAP }}>
              {renderBodyCells(leftMeta, item, rowBackground, context)}
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-hidden">
          <div className="grid h-full" style={{ gridTemplateColumns: templates.center, columnGap: GRID_GAP, minWidth: centerMeta.length > 0 ? centerMinWidth : undefined }}>
            {renderBodyCells(centerMeta, item, rowBackground, context)}
          </div>
        </div>

        {rightMeta.length > 0 ? (
          <div className="sticky right-0 z-20 flex-shrink-0 border-l border-gray-100" style={{ width: rightWidth, backgroundColor: rowBackground }}>
            <div className="grid h-full" style={{ gridTemplateColumns: templates.right, columnGap: GRID_GAP }}>
              {renderBodyCells(rightMeta, item, rowBackground, context)}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  // —— 标题行：与内容行共用同一模板 + 间距 ——
  const headerNode = (
    <div className="border-b border-gray-200 bg-gray-50" style={{ height: headerHeight }}>
      <div className="flex h-full">
        {leftMeta.length > 0 ? (
          <div className="sticky left-0 z-30 flex-shrink-0 border-r border-gray-200 bg-gray-50" style={{ width: leftWidth }}>
            <div className="grid h-full" style={{ gridTemplateColumns: templates.left, columnGap: GRID_GAP }}>
              {renderHeaderCells(leftMeta)}
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-hidden">
          <div className="grid h-full" style={{ gridTemplateColumns: templates.center, columnGap: GRID_GAP, minWidth: centerMeta.length > 0 ? centerMinWidth : undefined }}>
            {renderHeaderCells(centerMeta)}
          </div>
        </div>

        {rightMeta.length > 0 ? (
          <div className="sticky right-0 z-30 flex-shrink-0 border-l border-gray-200 bg-gray-50" style={{ width: rightWidth }}>
            <div className="grid h-full" style={{ gridTemplateColumns: templates.right, columnGap: GRID_GAP }}>
              {renderHeaderCells(rightMeta)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  const virtualHeight = Math.max(totalRows * rowHeight, fallbackBodyHeight);
  const bodyNode = totalRows > 0 ? (
    <div className="relative" style={{ height: virtualHeight }}>
      <div className="absolute inset-x-0" style={{ top: offsetY }}>
        {rowsToRender.map(renderRow)}
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center bg-white" style={{ height: fallbackBodyHeight }}>
      {emptyContent}
    </div>
  );

  const defaultLoading = (
    <div className="flex flex-col items-center gap-3 text-sm text-gray-500">
      <div className="h-9 w-9 animate-spin border-2 border-primary/20 border-t-primary" />
      <span>加载中...</span>
    </div>
  );

  const loadingNode = loading ? (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
      {loadingState ?? defaultLoading}
    </div>
  ) : null;

  const wrapperClassName = ['relative flex h-full w-full overflow-hidden border border-gray-200 bg-white', className].filter(Boolean).join(' ');

  return (
    <div className={wrapperClassName} style={{ height }} role="grid">
      <div ref={containerRef} className="relative h-full w-full overflow-auto">
        <div style={{ minWidth: contentWidth }}>
          <div className="sticky top-0 z-40 bg-white">{headerNode}</div>
          {bodyNode}
        </div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-50 w-9 bg-gradient-to-r from-black/15 via-black/5 to-transparent transition-opacity" style={{ opacity: showLeftShadow ? 1 : 0 }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-50 w-9 bg-gradient-to-l from-black/15 via-black/5 to-transparent transition-opacity" style={{ opacity: showRightShadow ? 1 : 0 }} />

      {loadingNode}
    </div>
  );
}
