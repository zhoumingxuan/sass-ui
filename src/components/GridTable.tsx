'use client';

import type {
    CSSProperties,
    ReactNode,
    MouseEvent as ReactMouseEvent,
    KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from './Checkbox';
import { Inbox, FileQuestion } from 'lucide-react'; // 空态图标：lucide
import ActionLink from './ActionLink';

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

/** —— 内置操作列：通用配置 —— */
export type RowAction<T> = {
    key: string;
    label: ReactNode;
    onClick?: (row: T) => void;
    href?: string;
    disabled?: boolean;
    danger?: boolean;
    emphasized?: boolean;
};
export type RowActionsConfig<T> = {
    title?: ReactNode;                  // 列头，默认“操作”
    width?: number | string;            // 可选宽度（不传为 auto）
    getActions: (row: T) => RowAction<T>[];
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
    /** 自定义空态节点（可选；若不传则使用默认写死的空态） */
    emptyState?: ReactNode;
    /** 轻量加载态开关与文案 */
    loading?: boolean;
    loadingState?: ReactNode;
    selection?: GridSelection<T>;
    onRowClick?: (row: T, context: GridCellRenderContext<T>, event: ReactMouseEvent<HTMLDivElement>) => void;
    onRowDoubleClick?: (row: T, context: GridCellRenderContext<T>, event: ReactMouseEvent<HTMLDivElement>) => void;

    /** —— 序号列 —— */
    showIndex?: boolean;           // 是否显示序号列（默认不显示）

    /** —— 内置操作列（通用） —— */
    rowActions?: RowActionsConfig<T>;
};

type ColumnMeta<T> = {
    column: GridColumn<T>;
    width: number | string;
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

// ---- 从 CSS 变量读取样式数值 ----
function cssNumber(varName: string, fallback: number) {
    if (typeof window === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName);
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
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

function resolveColumnWidth<T>(col: GridColumn<T>): string | number {
    if (typeof col.width === 'number') return col.width;
    if (typeof col.width === 'string') {
        const px = parsePx(col.width);
        if (px != null) return px;
    }
    if (typeof col.minWidth === 'number') return col.minWidth;
    if (typeof col.maxWidth === 'number') return col.maxWidth;
    return 'auto'; // 默认值
}

function buildTemplate<T>(metas: ColumnMeta<T>[]): string {
    return metas
        .map((meta) => {
            const col = meta.column;
            const isSelection = col.key === '__selection__';
            const isIndex = col.key === '__index__';
            const isActions = col.key === '__actions__';
            const hasExplicit =
                typeof col.width !== 'undefined' ||
                typeof col.minWidth === 'number' ||
                typeof col.maxWidth === 'number' ||
                isSelection ||
                isIndex ||
                isActions;

            if (!hasExplicit) return 'auto';
            if (typeof col.width === 'number' && col.width !== 0) return `${col.width}px`;
            if (typeof col.width === 'string') return col.width;
            return `${meta.width}`;
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
    showIndex = false,
    rowActions,
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

    // ==== 列切分（actions 默认右固定） ====
    const metasAll = useMemo(() => {
        const cols = columns
            .filter((c) => !c.hidden)
            .map<GridColumn<T>>((c) => {
                if (!c.fixed && c.intent === 'actions') return { ...c, fixed: 'right' };
                return c;
            })
            .map(makeMeta<T>);

        // 外部已经配置了 actions 列，则不自动注入内置操作列
        const hasExternalActions = columns.some((c) => c.intent === 'actions' || c.key === '__actions__');

        // 左侧选择列
        const selectionMeta: ColumnMeta<T> | null = selection
            ? makeMeta<T>({
                key: '__selection__',
                title: selection.headerTitle ?? '',
                align: 'center',
                intent: 'meta',
                semantic: 'integer',
                fixed: 'left',
                width: selection.columnWidth,
            } as GridColumn<T>)
            : null;

        // 序号列（左固定；默认在可勾选列之后，你之前习惯放选择列第一）
        const indexMeta: ColumnMeta<T> | null = showIndex
            ? makeMeta<T>({
                key: '__index__',
                title: '序号',
                align: 'center',
                intent: 'meta',
                semantic: 'integer',
                fixed: 'left',
            } as GridColumn<T>)
            : null;

        // 内置操作列（默认右固定）
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

        // 左固定：选择 -> 序号 ->（其它左固定列）
        if (selectionMeta) metas.push(selectionMeta);
        if (indexMeta) metas.push(indexMeta);

        metas.push(...cols); // 中间与外部声明的列

        // 操作列通常置末尾
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
        return rows.slice(startIndex, endIndex);
    }, [rows, scrollTop, viewHeight, headerHeight, rowHeight]);

    // ==== 选择/悬停/点击 ====
    const [hoverKey, setHoverKey] = useState<string | number | null>(null);
    const selectedSet = useMemo(() => new Set(selection?.selectedKeys ?? []), [selection?.selectedKeys]);

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
                    return (
                        <div
                            key={`h-${String(m.column.key)}`}
                            className={cx(
                                isSelection || isActions ? 'flex items-center justify-center' : '',
                                'gt-head-cell sticky top-0 border-b border-gray-200 bg-gray-50 whitespace-nowrap',
                                type === 'center' ? 'min-w-full' : '',
                                'px-2 text-xs font-medium text-gray-600',
                                m.textAlignClass,
                                m.semanticClass,
                                m.column.headerClassName
                            )}
                            style={{ height: headerHeight }}
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
                        const bg = isSelected ? (isHovered ? 'var(--gt-selected-hover)' : 'var(--gt-selected)') : isHovered ? 'var(--gt-hover)' : base;

                        const commonProps = {
                            className: cx(
                                'gt-cell overflow-hidden whitespace-nowrap',
                                'px-2 text-sm text-gray-900',
                                isSelection || isActions ? 'flex items-center justify-center' : '',
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

                        // ……visibleRows.map 内部：
                        if (isActions) {
                            const acts = rowActions?.getActions ? rowActions.getActions(item.row) : [];
                            return (
                                <div key={`b-${String(m.column.key)}-${String(item.key)}`} {...commonProps}>
                                    <div
                                        className="flex items-center justify-center"
                                        data-table-row-trigger="ignore"
                                    >
                                        {acts.map((a) => (
                                            <div key={a.key} className="first:pl-0 last:pr-0">
                                                {
                                                    <ActionLink
                                                        emphasized
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!a.disabled) a.onClick?.(item.row);
                                                        }}
                                                        disabled={a.disabled}
                                                        className="text-[0.8em] leading-none"
                                                    >
                                                        {a.label}
                                                    </ActionLink>
                                                }
                                            </div>
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
                            return <div key={`b-${String(m.column.key)}-${String(item.key)}`} {...commonProps}>
                                {m.column.render(item.row, ctx)}
                            </div>
                        }


                        const value = (item.row[m.column.key as keyof T] as ReactNode);

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
            className="absolute inset-0 z-[200] flex items-center justify-center"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />
            <div className="relative flex items-center gap-3 rounded-md bg-white/90 px-3 py-2 text-sm text-gray-600 shadow-sm">
                <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span>{text ?? '加载中…'}</span>
            </div>
        </div>
    );

    const isEmpty = rows.length === 0;
    const showEmpty = !loading && isEmpty;
    const showLoading = loading;

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
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
    );
}
