"use client";

import { useEffect, useMemo, useRef, useState, ReactNode, useCallback } from "react";
import Button from "./Button";
import { Search, X, Check, Plus, Eraser, RotateCcw, AlertCircle } from "lucide-react";

type HighlightMode = "tint" | "outline" | "bold";
type Density = "compact" | "standard";
type PreviewPlacement = "right" | "bottom";

export type SuperSearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  meta?: Record<string, string>;
  avatarUrl?: string;
};

export type SuperSearchSection = {
  key: string;
  label: string;
  icon?: ReactNode;
  items: SuperSearchItem[];
  seeAllHref?: string;
  // New: optional multi-field search keys for normal search mode
  // Example: ['title', 'subtitle', 'status', 'meta.订单ID']
  search_keys?: string[];
  // New: optional minimum width (px) for this section column in normal mode
  // Used to compute dropdown width when multiple sections match
  minWidth?: number;
};

export type SuperSearchProps = {
  placeholder?: string;
  sections: SuperSearchSection[];
  density?: Density;
  columns?: 2 | 3;
  preview?: PreviewPlacement;
  highlight?: HighlightMode;
  className?: string;
  history?: string[];
  cache_key?: string;
  hints?: string[];
  enablePreview?: boolean;
  selectable?: boolean;
  selectionMode?: "single" | "multiple";
  sectionSelectionMode?: Record<string, "single" | "multiple">;
  showSelectedBelow?: boolean;
  selected?: Record<string, SuperSearchItem[]>;
  onSelectionChange?: (sel: Record<string, SuperSearchItem[]>) => void;
  filterEntitySelectionMode?: "single" | "multiple";
  // Filter (fields) mode props
  filterMode?: "entity" | "fields";
  filterFields?: { label: string; param: string; icon?: ReactNode }[];
  filterFieldSelectionMode?: "single" | "multiple";
  filterEmptyMeansAll?: boolean;
  onFilterSearch?: (query: string, fields: string[]) => void;
  // Multi-group filter (fields) mode
  allowMultiFilterGroups?: boolean;
  maxFilterGroups?: number;
  onFilterSearchGroups?: (groups: { query: string; fields: string[] }[]) => void;
  capCounts?: boolean;
  // Whether to show truncation hint when matches exceed display cap
  showTruncationHint?: boolean;
  // Custom renderer for the truncation hint
  renderTruncationHint?: (args: { displayed: number; total: number; section: SuperSearchSection }) => ReactNode;
  // Whether to show sections with zero matches in normal search mode (default: false)
  showEmptySections?: boolean;
};

function useDebounced<T>(value: T, delay = 160) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return v;
}

function matchQuery(q: string, text: string) {
  return text.toLowerCase().includes(q.trim().toLowerCase());
}

export default function SuperSearch({
  placeholder = "输入关键字，跨实体模糊匹配",
  sections,
  density = "standard",
  columns,
  preview = "right",
  highlight = "tint",
  className = "",
  hints = [],
  enablePreview = true,
  selectable = true,
  selectionMode = "multiple",
  sectionSelectionMode,
  showSelectedBelow = true,
  selected,
  onSelectionChange,
  filterEntitySelectionMode = "multiple",
  filterMode = "entity",
  filterFields = [],
  filterFieldSelectionMode = "multiple",
  filterEmptyMeansAll = true,
  onFilterSearch,
  allowMultiFilterGroups = false,
  maxFilterGroups = 5,
  onFilterSearchGroups,
  capCounts = true,
  showTruncationHint = true,
  renderTruncationHint,
  showEmptySections = false,
  cache_key,
}: SuperSearchProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const dText = useDebounced(text, 160);
  const [activeSection, setActiveSection] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [chipsMode, setChipsMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [focusedWithin, setFocusedWithin] = useState(false);
  // Track whether the last pointerdown was outside to avoid sticky-keeping on external clicks
  const externalClickRef = useRef(false);
  const isControlled = selected !== undefined;
  const [innerSel, setInnerSel] = useState<Record<string, SuperSearchItem[]>>({});
  const selection = isControlled ? (selected as Record<string, SuperSearchItem[]>) : innerSel;
  const [activeEntities, setActiveEntities] = useState<string[]>([]);
  const [activeFields, setActiveFields] = useState<string[]>([]);
  const [filterGroups, setFilterGroups] = useState<{ query: string; fields: string[] }[]>([]);
  const [inputHeight, setInputHeight] = useState(0);
  const [overlayHeight, setOverlayHeight] = useState(0);
  const [inputWidth, setInputWidth] = useState(0);
  const selectedCount = Object.values(selection ?? {}).flat().length;

  // Local history (persisted with localStorage when cache_key provided)
  const [localHistory, setLocalHistory] = useState<string[]>([]);
  const maxHistory = 20;

  const loadHistory = useCallback(() => {
    if (!cache_key) {
      setLocalHistory([]);
      return;
    }
    try {
      const raw = window.localStorage.getItem(cache_key);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          setLocalHistory(arr.filter((x) => typeof x === "string"));
          return;
        }
      }
      setLocalHistory([]);
    } catch {
      setLocalHistory([]);
    }
  }, [cache_key]);

  const persistHistory = useCallback(
    (arr: string[]) => {
      if (!cache_key) return;
      setLocalHistory(arr);
      try {
        window.localStorage.setItem(cache_key, JSON.stringify(arr));
      } catch {}
    },
    [cache_key],
  );

  const addHistory = useCallback(
    (q: string) => {
      if (!cache_key) return;
      const v = (q || "").trim();
      if (!v) return;
      setLocalHistory((prev) => {
        const next = [v, ...prev.filter((x) => x !== v)].slice(0, maxHistory);
        try { window.localStorage.setItem(cache_key, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [cache_key],
  );

  const clearHistory = useCallback(() => {
    persistHistory([]);
  }, [persistHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Preview control
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  // Lightweight notice when reaching group limit
  const [groupLimitNotice, setGroupLimitNotice] = useState(false);
  const groupLimitTimerRef = useRef<number | null>(null);
  const triggerGroupLimitNotice = () => {
    try {
      if (groupLimitTimerRef.current) window.clearTimeout(groupLimitTimerRef.current);
    } catch {}
    setGroupLimitNotice(true);
    // Hide after a short delay
    // 1400ms balances visibility and lightness
    // Store as number for TS + DOM timeout
    const id = window.setTimeout(() => setGroupLimitNotice(false), 1400);

    groupLimitTimerRef.current = id as number;
  };

  // Common helpers for event handlers
  const keepFocusWithin = useCallback(() => {
    setFocusedWithin(true);
  }, []);

  const focusInput = useCallback(() => {
    try {
      inputRef.current?.focus();
    } catch {}
  }, []);
  

  // Stable refs for external callbacks to avoid effect re-trigger loops
  const onFilterSearchRef = useRef(onFilterSearch);
  const onFilterSearchGroupsRef = useRef(onFilterSearchGroups);
  useEffect(() => {
    onFilterSearchRef.current = onFilterSearch;
    onFilterSearchGroupsRef.current = onFilterSearchGroups;
  }, [onFilterSearch, onFilterSearchGroups]);

  // Helper: safely extract nested value by path like "meta.订单ID"

  const getByPath = useCallback((obj: unknown, path: string): string => {
    if (!obj || !path) return "";
    const parts = path.split(".");
    let cur:unknown = obj;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in cur) cur = (cur as Record<string,unknown>)[p];
      else return "";
    }
    if (cur == null) return "";
    if (typeof cur === "string") return cur;
    if (typeof cur === "number" || typeof cur === "boolean") return String(cur);
    if (typeof cur === "object") return Object.values(cur).join(" ");
    return "";
  }, []);

  // Build searchable text for an item under a section based on optional search_keys
  const buildSearchBlob = useCallback((section: SuperSearchSection, it: SuperSearchItem) => {
    const keys = section.search_keys;
    if (keys && keys.length > 0) {
      return keys.map((k) => getByPath(it, k)).filter(Boolean).join(" ");
    }
    // default behavior (backward compatible)
    return `${it.title ?? ""} ${it.subtitle ?? ""}`.trim();
  }, [getByPath]);

  const filtered = useMemo(() => {
    if (!dText) return sections.map((s) => ({ ...s, items: s.items.slice(0, 6) }));
    const q = dText.trim();
    return sections.map((s) => ({
      ...s,
      items: s.items
        .filter((it) => matchQuery(q, buildSearchBlob(s, it)))
        .slice(0, 10),
    }));
  }, [sections, dText, buildSearchBlob]);

  // Sections to render in normal search mode considering whether to hide empty sections
  const renderSections = useMemo(() => {
    if (!dText) return filtered;
    return showEmptySections ? filtered : filtered.filter((s) => s.items.length > 0);
  }, [filtered, dText, showEmptySections]);

  // Matched counts before slicing for improved UX hints
  const matchedCounts = useMemo(() => {
    if (!dText) return Object.fromEntries(sections.map((s) => [s.key, s.items.length]));
    const q = dText.trim();
    return Object.fromEntries(
      sections.map((s) => [s.key, s.items.filter((it) => matchQuery(q, buildSearchBlob(s, it))).length]),
    );
  }, [sections, dText, buildSearchBlob]);

  function formatBadgeCount(n: number) {
    if (capCounts && n > 99) return "99+";
    return String(n);
  }

  const hasAny = filtered.some((s) => s.items.length > 0);
  const densityRow = density === "compact" ? "h-10" : "h-12";

  // Measure input geometry to control floating layers and dropdown offsets/width
  useEffect(() => {
    function measure() {
      const iw = inputWrapRef.current;
      const ov = overlayRef.current;
      setInputHeight(iw ? Math.round(iw.getBoundingClientRect().height) : 0);
      setInputWidth(iw ? Math.round(iw.getBoundingClientRect().width) : 0);
      const overlayVisible = (chipsMode && focusedWithin) || (!chipsMode && focusedWithin && (((showSelectedBelow && selectedCount > 0)) || (allowMultiFilterGroups && filterGroups.length > 0)));
      setOverlayHeight(overlayVisible && ov ? Math.round(ov.getBoundingClientRect().height) : 0);
    }

    measure();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measure()) : null;
    if (ro) {
      if (inputWrapRef.current) ro.observe(inputWrapRef.current);
      if (overlayRef.current) ro.observe(overlayRef.current);
    } else {
      const id = window.setInterval(measure, 200);
      return () => window.clearInterval(id);
    }

    return () => {
      try {
        ro?.disconnect();
      } catch {}
    };
  }, [chipsMode, focusedWithin, showSelectedBelow, selectedCount, allowMultiFilterGroups, filterGroups.length]);

  // Compute dropdown width in normal mode based on matched sections' minWidth
  const dropdownWidth = useMemo(() => {
    if (!open || chipsMode) return undefined as number | undefined;
    const q = dText?.trim();
    if (!q) return undefined;
    // Determine how many columns are visible per current props
    const visible = renderSections.filter((s) => showEmptySections ? true : (s.items.length > 0));
    if (visible.length === 0) return undefined;
    const colCount = columns ?? Math.min(Math.max(visible.length, 1), 3);
    const considered = visible.slice(0, colCount);
    const DEFAULT_MIN = 280; // px fallback for nice UX
    const desired = considered.reduce((sum, s) => sum + (s.minWidth ?? DEFAULT_MIN), 0);
    // Only expand beyond input width; otherwise keep natural width
    return desired > inputWidth ? desired : undefined;
  }, [open, chipsMode, dText, renderSections, showEmptySections, columns, inputWidth]);

  useEffect(() => {
    function onDocPointerDown(e: PointerEvent | MouseEvent) {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      // Mark as external click so blur handler won't force sticky open
      externalClickRef.current = true;
      setOpen(false);
      setFocusedWithin(false);
    }
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function moveHighlight(dir: 1 | -1) {
    const sec = renderSections[activeSection];
    if (!sec) return;
    const len = sec.items.length;
    if (len === 0) return;
    setActiveIndex((i) => (i + dir + len) % len);
  }

  function switchSection(dir: 1 | -1) {
    const len = renderSections.length;
    if (len <= 1) return;
    const next = (activeSection + dir + len) % len;
    setActiveSection(next);
    const targetLen = renderSections[next]?.items.length ?? 0;
    setActiveIndex((i) => (targetLen === 0 ? 0 : Math.min(i, targetLen - 1)));
  }

  const gridCols = useMemo(() => {
    // Determine max columns based on visible sections when searching
    const visibleCount = renderSections.length;
    const maxCols = columns ?? Math.min(Math.max(visibleCount, 1), 3);
    if (maxCols <= 1) return "grid-cols-1";
    if (maxCols === 2) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
  }, [columns, renderSections.length]);

  // Masonry-like columns for better space usage when section heights vary
  const masonryCols = useMemo(() => {
    const visibleCount = renderSections.length;
    const maxCols = columns ?? Math.min(Math.max(visibleCount, 1), 3);
    if (maxCols <= 1) return "columns-1";
    if (maxCols === 2) return "columns-1 md:columns-2";
    return "columns-1 md:columns-2 xl:columns-3";
  }, [columns, renderSections.length]);

  // Keep active section/index in range when visible sections change
  useEffect(() => {
    const len = renderSections.length;
    if (len === 0) {
      setActiveSection(0);
      setActiveIndex(0);
      return;
    }
    if (activeSection >= len) {
      setActiveSection(len - 1);
      setActiveIndex(0);
    } else {
      const curLen = renderSections[activeSection]?.items.length ?? 0;
      if (activeIndex >= curLen) setActiveIndex(curLen > 0 ? curLen - 1 : 0);
    }
  }, [renderSections.length, activeSection, activeIndex, renderSections]);

  function getSectionMode(key: string): "single" | "multiple" {
    return sectionSelectionMode?.[key] ?? selectionMode;
  }

  function commitSelection(secKey: string, item: SuperSearchItem) {
    if (!selectable) return;
    // Store current query as a valuable history signal when a result is chosen
    if (text.trim()) addHistory(text);
    const mode = getSectionMode(secKey);
    const next: Record<string, SuperSearchItem[]> = { ...(selection ?? {}) };
    const list = next[secKey] ?? [];
    const exists = list.find((x) => x.id === item.id);
    if (mode === "single") {
      next[secKey] = exists ? [] : [item];
    } else {
      next[secKey] = exists ? list.filter((x) => x.id !== item.id) : [...list, item];
    }
    if (isControlled) onSelectionChange?.(next);
    else {
      setInnerSel(next);
      onSelectionChange?.(next);
    }
  }

  

  function clearAllSelection() {
    const next: Record<string, SuperSearchItem[]> = {};
    if (isControlled) {
      onSelectionChange?.(next);
    } else {
      setInnerSel(next);
      onSelectionChange?.(next);
    }
  }

  // Build dynamic placeholder in fields filter mode
  const dynamicPlaceholder = useMemo(() => {
    if (!chipsMode || filterMode !== "fields") return placeholder;
    const labels = (filterFields || [])
      .filter((f) => (activeFields.length > 0 ? activeFields.includes(f.param) : true))
      .map((f) => f.label);
    if (labels.length === 0) return placeholder;
    const joined = labels.slice(0, 3).join("、") + (labels.length > 3 ? "…" : "");
    return `在${joined}中搜索`;
  }, [chipsMode, filterMode, filterFields, activeFields, placeholder]);

  // Fire filter callback in fields mode on meaningful changes (debounced input)
  // Guard with a signature ref to prevent repeated calls when parent re-renders
  const lastFilterSigRef = useRef<string>("");
  useEffect(() => {
    if (!chipsMode || filterMode !== "fields") return;

    const allFields = (filterFields || []).map((f) => f.param);
    const currentFields = activeFields.length > 0 ? activeFields : (filterEmptyMeansAll ? allFields : []);

    // Build a compact signature for change detection
    const sig = JSON.stringify({
      dText,
      currentFields,
      filterGroups,
      allowMultiFilterGroups,
      allFields,
    });
    if (lastFilterSigRef.current === sig) return;
    lastFilterSigRef.current = sig;

    if (allowMultiFilterGroups) {
      const composed = [
        ...filterGroups,
        ...(dText ? [{ query: dText, fields: currentFields }] : []),
      ].map((g) => ({
        query: g.query,
        fields: g.fields.length > 0 ? g.fields : (filterEmptyMeansAll ? allFields : []),
      }));
      onFilterSearchGroupsRef.current?.(composed);
      // Backward compatibility: if group callback not provided, call single callback
      if (!onFilterSearchGroupsRef.current && onFilterSearchRef.current) {
        onFilterSearchRef.current(dText, currentFields);
      }
    } else if (onFilterSearchRef.current) {
      onFilterSearchRef.current(dText, currentFields);
    }
  }, [chipsMode, filterMode, dText, activeFields, filterEmptyMeansAll, allowMultiFilterGroups, filterGroups, filterFields]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onFocusCapture={() => setFocusedWithin(true)}
      onBlurCapture={(e) => {
        const rt = e.relatedTarget as Node | null;
        window.setTimeout(() => {
          const root = containerRef.current;
          if (!root) return setFocusedWithin(false);
          const active = document.activeElement;
          const inside = (active && root.contains(active)) || (rt && root.contains(rt));
          if (inside) {
            setFocusedWithin(true);
          } else {
            // In normal mode with selections or groups, keep the panel sticky while interacting within the widget.
            const shouldStick = !chipsMode && (((showSelectedBelow && selectedCount > 0) || (allowMultiFilterGroups && filterGroups.length > 0)));
            // If the blur is caused by an external click, do not keep sticky
            if (externalClickRef.current) {
              setFocusedWithin(false);
            } else {
              setFocusedWithin(shouldStick ? true : false);
            }
          }
          // Reset external click marker after handling blur
          externalClickRef.current = false;
        }, 0);
      }}
    >
      {/* SearchInput */}
      <div
        ref={inputWrapRef}
        className={`flex items-center gap-2 rounded-xl border border-gray-200 bg-white shadow-sm ${density === "compact" ? "h-10 px-3" : "h-12 px-4"}`}
        onPointerDownCapture={() => {
          // Keep focus within to prevent the selected panel from hiding during input interactions
          keepFocusWithin();
        }}
        onClick={() => {
          if (!chipsMode) setOpen(true);
          focusInput();
        }}
      >
        <Search className="h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            // Ensure dropdown re-opens while typing in normal mode
            if (chipsMode) setOpen(false);
            else setOpen(true);
          }}
          onFocus={() => {
            if (!chipsMode) setOpen(true);
          }}
          placeholder={dynamicPlaceholder}
          className="flex-1 bg-transparent text-sm placeholder-gray-400 focus:outline-none"
          onKeyDown={(e) => {
            // Fields filter mode submit
            if (chipsMode && filterMode === "fields" && e.key === "Enter") {
              if (allowMultiFilterGroups) {
                const trimmed = text.trim();
                if (trimmed) {
                  const fields = activeFields.length > 0 ? activeFields : (filterEmptyMeansAll ? filterFields.map((f) => f.param) : []);
                  if (filterGroups.length < maxFilterGroups) {
                    addHistory(trimmed);
                    setFilterGroups((prev) => [...prev, { query: trimmed, fields }]);
                    setText("");
                  } else {
                    // Reached limit: show a lightweight inline notice
                    triggerGroupLimitNotice();
                  }
                }
              } else if (onFilterSearch) {
                const selected = activeFields.length > 0 ? activeFields : (filterEmptyMeansAll ? filterFields.map((f) => f.param) : []);
                addHistory(text);
                onFilterSearch(text, selected);
              }
              return;
            }

            // Normal mode navigation while keeping focus on input
            if (!chipsMode) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
                moveHighlight(1);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setOpen(true);
                moveHighlight(-1);
              } else if (e.key === "Tab") {
                e.preventDefault();
                switchSection(e.shiftKey ? -1 : 1);
              } else if (e.key === "Enter") {
                e.preventDefault();
                addHistory(text);
                const sec = renderSections[activeSection];
                const it = sec?.items[activeIndex];
                if (sec && it) commitSelection(sec.key, it);
              }
            }
          }}
        />
        {selectedCount > 0 && (
          <span className="inline-flex items-center gap-0.5 select-none rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-primary whitespace-nowrap">
            已选 {selectedCount}
            <button
              type="button"
              aria-label="清除已选"
              className="ml-0.5 rounded p-0 text-primary/70 hover:bg-primary/15 hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                clearAllSelection();
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}
        {allowMultiFilterGroups && filterMode === "fields" && filterGroups.length > 0 && (
          <span
            className="inline-flex items-center gap-0.5 select-none rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
            aria-label={`已创建 ${filterGroups.length} 个条件组`}
          >
            已加 {filterGroups.length} 组条件
            <button
              type="button"
              aria-label="清除条件组"
              className="ml-0.5 rounded p-0 text-primary/70 hover:bg-primary/15 hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                // Keep focus within the search to avoid closing the selected panel
                 focusInput();
                 setFilterGroups([]);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
                
          </span>
        )}
        {chipsMode ? (
          <Button
            size={density === "compact" ? "small" : "medium"}
            appearance="ghost"
            variant="default"
            onClick={(e) => {
              e.stopPropagation();
              setChipsMode(false);
              setOpen(true);
              inputRef.current?.focus();
            }}
            className="text-gray-600 whitespace-nowrap"
          >
            转为普通搜索
          </Button>
        ) : (
          <Button
            size={density === "compact" ? "small" : "medium"}
            appearance="ghost"
            variant="default"
            onClick={(e) => {
              e.stopPropagation();
              setChipsMode(true);
              setOpen(false);
              // 保留已选匹配项与条件组，不清空
            }}
            className="text-gray-600 whitespace-nowrap"
          >
            转为筛选
          </Button>
        )}
      </div>

      {/* Filter mode panel */}
      {chipsMode && focusedWithin && (
        <div
          ref={overlayRef}
          className={`absolute left-0 right-0 z-30 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-sm`}
          style={{ top: inputHeight + 4 }}
          onPointerDownCapture={() => {
            // Keep focus when interacting with the filter panel area
            focusInput();
          }}
        >
          <div className="flex flex-col gap-2">
            {selectedCount > 0 && (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs text-gray-400">已选</span>
                {Object.entries(selection).map(([k, arr]) =>
                  arr.map((it) => (
                    <Chip key={`${k}-${it.id}`} label={`${it.title}`} removable onRemove={() => commitSelection(k, it)} />
                  )),
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
            {filterMode === "fields" && (
              <>
                <span className="text-xs text-gray-400">字段</span>
                {(filterFields ?? []).map((f) => {
                  const active = activeFields.includes(f.param);
                  return (
                    <button
                      key={f.param}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${
                        active ? "border-primary/20 bg-primary/10 text-primary" : "border-gray-200 bg-gray-50 text-gray-600"
                      }`}
                      onClick={() => {
                        setActiveFields((prev) => {
                          if (filterFieldSelectionMode === "single") return active ? [] : [f.param];
                          return active ? prev.filter((k) => k !== f.param) : [...prev, f.param];
                        });
                      }}
                    >
                      {f.icon && <span className="h-3.5 w-3.5 text-current">{f.icon}</span>}
                      {f.label}
                    </button>
                  );
                })}

                {allowMultiFilterGroups && (
                  <div className="w-full flex flex-wrap items-center gap-2 mt-1">
                    {filterGroups.length > 0 && <span className="text-xs text-gray-400">条件组</span>}
                    {filterGroups.map((g, gi) => {
                      const labelFields = (filterFields || [])
                        .filter((f) => g.fields.includes(f.param))
                        .map((f) => f.label)
                        .slice(0, 2)
                        .join("+") + (g.fields.length > 2 ? "+…" : "");
                      const label = `${labelFields || "全部字段"}: ${g.query}`;
                      return (
                        <span key={gi} className="inline-flex max-w-[16rem] min-w-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                          <span className="min-w-0 truncate">{label}</span>
                          <button
                            className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            aria-label="移除条件"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Maintain focus to keep chips panel open
                              try { inputRef.current?.focus(); } catch {}
                              setFilterGroups((prev) => prev.filter((_, idx) => idx !== gi));
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      );
                    })}

                    
                  </div>
                )}
              </>
            )}
            {filterMode !== "fields" && (
              <>
                <span className="text-xs text-gray-400">实体</span>
            {sections.map((s) => {
              const active = activeEntities.includes(s.key);
              return (
                <button
                  key={s.key}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${
                    active ? "border-primary/20 bg-primary/10 text-primary" : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                  onClick={() => {
                    setActiveEntities((prev) => {
                      if (filterEntitySelectionMode === "single") return active ? [] : [s.key];
                      return active ? prev.filter((k) => k !== s.key) : [...prev, s.key];
                    });
                  }}
                >
                  {s.icon && <span className="h-3.5 w-3.5 text-current">{s.icon}</span>}
                  {s.label}
                </button>
              );
            })}
              </>
            )}
            {allowMultiFilterGroups && (
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs text-gray-400">关键词</span>
                {text ? (
                  <Chip label={text} removable onRemove={() => setText("")} />)
                  : (<span className="text-xs text-gray-400">输入后按回车或点击右侧添加</span>)}
                <div className="ml-auto flex items-center gap-2">
                  {groupLimitNotice && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-500">
                      <AlertCircle className="h-3.5 w-3.5" /> 已达上限（{maxFilterGroups}）
                    </span>
                  )}
                  <Button
                    size="small"
                    appearance="link"
                    variant="default"
                    className="text-gray-500"
                    disabled={filterGroups.length >= maxFilterGroups || !text.trim()}
                    onClick={() => {
                      const trimmed = text.trim();
                      if (!trimmed) return;
                      if (filterGroups.length >= maxFilterGroups) {
                        triggerGroupLimitNotice();
                        return;
                      }
                      const fields = activeFields.length > 0 ? activeFields : (filterEmptyMeansAll ? (filterFields || []).map((f) => f.param) : []);
                      setFilterGroups((prev) => [...prev, { query: trimmed, fields }]);
                      setText("");
                      focusInput();
                    }}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> 添加条件
                  </Button>
                  <Button
                    size="small"
                    appearance="link"
                    variant="default"
                    className="text-gray-500"
                    onClick={() => {
                      setText("");
                      focusInput();
                      setFilterGroups([]);
                    }}
                  >
                    <Eraser className="mr-1.5 h-3.5 w-3.5" /> 清空条件
                  </Button>
                </div>
              </div>
            )}
            {!allowMultiFilterGroups && (
              <>
                {text && (
                  <>
                    <span className="text-xs text-gray-400">关键词</span>
                    <Chip label={text} removable onRemove={() => setText("")} />
                  </>
                )}
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Unified overlay (normal mode): selected items and/or condition groups */}
      {(!chipsMode && focusedWithin && ((showSelectedBelow && selectedCount > 0) || (allowMultiFilterGroups && filterGroups.length > 0))) && false && (
        <div
          ref={overlayRef}
          className="absolute left-0 right-0 z-30 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
          style={{ top: inputHeight + 4 }}
          onPointerDownCapture={() => {
            // Clicking blank area should not close the panel; keep focus on input
            focusInput();
          }}
        >
          <div className="flex flex-col gap-2">
            {showSelectedBelow && selectedCount > 0 && (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs text-gray-400">已选</span>
                {Object.entries(selection).map(([k, arr]) =>
                  arr.map((it) => (
                    <Chip key={`${k}-${it.id}`} label={`${it.title}`} removable onRemove={() => commitSelection(k, it)} />
                  )),
                )}
              </div>
            )}
            {allowMultiFilterGroups && filterGroups.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400">条件组</span>
                {filterGroups.map((g, gi) => {
                  const labelFields = (filterFields || [])
                    .filter((f) => g.fields.includes(f.param))
                    .map((f) => f.label)
                    .slice(0, 2)
                    .join("+") + (g.fields.length > 2 ? "+…" : "");
                  const label = `${labelFields || "全部字段"}: ${g.query}`;
                  return (
                    <span key={gi} className="inline-flex max-w-[16rem] min-w-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                      <span className="min-w-0 truncate">{label}</span>
                      <button
                        className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        aria-label="移除条件"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Keep focus on the input so focus-within remains true
                          try { inputRef.current?.focus(); } catch {}
                          setFilterGroups((prev) => prev.filter((_, idx) => idx !== gi));
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected items bar (normal mode only) */}
      {showSelectedBelow && !chipsMode && focusedWithin && selectedCount > 0 && false && (
        <div
          ref={overlayRef}
          className="absolute left-0 right-0 z-30 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
          style={{ top: inputHeight + 4 }}
          onMouseDownCapture={() => {
            // Preserve focus to prevent the overlay from closing on blank clicks
            try { inputRef.current?.focus(); } catch {}
          }}
        >
          <div className="flex  items-center gap-2 whitespace-nowrap">
            <span className="text-xs text-gray-400">已选</span>
            {Object.entries(selection).map(([k, arr]) =>
              arr.map((it) => (
                <Chip key={`${k}-${it.id}`} label={`${it.title}`} removable onRemove={() => commitSelection(k, it)} />
              )),
            )}
          </div>
        </div>
      )}

      {/* Dropdown (normal search mode only) */}
      {open && !chipsMode && (
        <div
          className="absolute z-20"
          style={{
            top: inputHeight + 4,
            width: dropdownWidth ? dropdownWidth : "100%",
          }}
        >
          <div className="rounded-2xl border border-gray-200 bg-white shadow-elevation-1">
            {((showSelectedBelow && selectedCount > 0) || (allowMultiFilterGroups && filterGroups.length > 0)) && focusedWithin && (
              <div className="p-2 border-b border-gray-100">
                <div className="flex flex-col gap-2">
                  {showSelectedBelow && selectedCount > 0 && (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="text-xs text-gray-400">已选</span>
                      {Object.entries(selection).map(([k, arr]) =>
                        arr.map((it) => (
                          <Chip key={`${k}-${it.id}`} label={`${it.title}`} removable onRemove={() => commitSelection(k, it)} />
                        )),
                      )}
                    </div>
                  )}
                  {allowMultiFilterGroups && filterGroups.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-400">条件</span>
                      {filterGroups.map((g, gi) => {
                        const labelFields = (filterFields || [])
                          .filter((f) => g.fields.includes(f.param))
                          .map((f) => f.label)
                          .slice(0, 2)
                          .join("+") + (g.fields.length > 2 ? "+…" : "");
                        const label = `${labelFields || "全部字段"}: ${g.query}`;
                        return (
                          <span key={gi} className="inline-flex max-w-[16rem] min-w-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                            <span className="min-w-0 truncate">{label}</span>
                            <button
                              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              aria-label="移除条件"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try { inputRef.current?.focus(); } catch {}
                                setFilterGroups((prev) => prev.filter((_, idx) => idx !== gi));
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            {!dText && (
              <div className="p-3">
                {(localHistory.length > 0) && (
                  <>
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                      <span>历史记录</span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearHistory();
                          try { inputRef.current?.focus(); } catch {}
                        }}
                        aria-label="清空历史记录"
                        title="清空历史记录"
                      >
                        <Eraser className="h-3.5 w-3.5" /> 清空
                      </button>
                    </div>
                    <div className="space-y-1">
                      {localHistory.slice(0, 8).map((h) => (
                        <button
                          key={h}
                          className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setText(h);
                            setOpen(true);
                            try { inputRef.current?.focus(); } catch {}
                            addHistory(h);
                          }}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {hints.length > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    {hints.map((t, i) => (
                      <div key={i}>{t}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!!dText && (showEmptySections || hasAny) && (
              <div className={`p-3 gap-x-4 ${masonryCols} [column-fill:_balance]`}>
                {renderSections.map((sec, si) => (
                  <div
                    key={sec.key}
                    className="min-w-0 mb-4 break-inside-avoid"
                    style={{ breakInside: "avoid" as unknown as 'auto' | 'avoid' }}
                  >
                    <div className="sticky top-0 z-10 mb-1 flex h-9 items-center rounded-md bg-white/80 px-2 text-sm font-semibold text-gray-700 backdrop-blur">
                      <div className="flex items-center gap-2 w-full">
                        <span className="inline-flex h-4 w-4 items-center justify-center text-gray-500">{sec.icon}</span>
                        <h3 className="flex items-center gap-2 text-gray-700 w-full">
                          <span>{sec.label}</span>
                          {(matchedCounts[sec.key] ?? sec.items.length) > 0 && (
                            <span
                              className={`inline-flex items-center h-5 px-2 rounded-full text-xs font-medium text-[color:var(--badge-fg)] bg-[color:var(--badge-bg)] ring-1 ring-[color:var(--badge-br)] ${
                                (si === activeSection || (selection?.[sec.key] ?? []).length > 0) ? "bg-[color:#DDEEFF]" : ""
                              }`}
                              aria-label={`${sec.label} 匹配 ${matchedCounts[sec.key] ?? sec.items.length} 条`}
                              style={{
                                ["--badge-fg" as string]: "#0A66C2",
                                ["--badge-bg" as string]: "#EAF3FF",
                                ["--badge-br" as string]: "#CDE1FF",
                              }}
                            >
                              {formatBadgeCount(matchedCounts[sec.key] ?? sec.items.length)}
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>

                    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 pb-1.5">
                      {sec.items.length === 0 && (
                        <li className="p-4 text-center text-sm text-gray-400">没有找到匹配项</li>
                      )}
                      {sec.items.map((it, ii) => {
                        const active = si === activeSection && ii === activeIndex;
                        const isSelected = (selection?.[sec.key] ?? []).some((x) => x.id === it.id);
                        const baseRow = `group relative w-full ${densityRow} px-3 flex items-center gap-3 hover:bg-primary/5`;
                        const activeRing = highlight === "outline" ? (active ? "ring-1 ring-primary" : "") : "";
                        const activeTint = highlight === "tint" ? (active ? "bg-primary/10" : "") : "";
                        const activeBold = highlight === "bold" ? (active ? "font-semibold" : "") : "";
                        const k = `${sec.key}-${it.id}`;
                        return (
                          <li
                            key={it.id}
                            className="relative"
                            onMouseEnter={() => {
                              if (enablePreview) {
                                
                                // 仅基于 hover 显示预览，不需要延迟
                                setHoverKey(k);
                              }
                              // 同步高亮到悬停项，便于方向键继续操作
                              setActiveSection(si);
                              setActiveIndex(ii);
                            }}
                            onMouseLeave={() => {
                              if (enablePreview) {
                                
                                // 仅基于 hover 隐藏预览，不需要延迟
                                setHoverKey((prev) => (prev === k ? null : prev));
                              }
                            }}
                          >
                            <button
                              type="button"
                              tabIndex={-1}
                              className={`${baseRow} ${activeRing} ${activeTint} ${activeBold} focus:outline-none focus-visible:outline-none`}
                              onMouseDown={(e) => {
                                // 防止鼠标点击将焦点移到按钮，保持输入框持焦
                                e.preventDefault();
                                try { inputRef.current?.focus(); } catch {}
                              }}
                              onFocus={() => {
                                setActiveSection(si);
                                setActiveIndex(ii);
                              }}
                              onClick={() => commitSelection(sec.key, it)}
                            >
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-400">
                                {it.avatarUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={it.avatarUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-xs leading-none">{sec.label.slice(0, 1)}</span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <div className="truncate text-sm text-gray-800">{renderHighlight(it.title, dText, highlight)}</div>
                                {it.subtitle && <div className="truncate text-xs text-gray-500">{it.subtitle}</div>}
                              </div>
                              <div className={`ml-auto flex items-center gap-2`}>
                                {isSelected && <Check className="h-4 w-4 text-primary" aria-hidden />}
                              </div>
                            </button>
                            {enablePreview && hoverKey === k && (
                              <PreviewCard item={it} sectionLabel={sec.label} placement={preview} />
                            )}
                          </li>
                        );
                      })}
                      {showTruncationHint && !!dText && (matchedCounts[sec.key] ?? 0) > sec.items.length && (
                        <li className="px-3 py-2 text-[11px] text-gray-400 text-center">
                          {renderTruncationHint ? (
                            renderTruncationHint({
                              displayed: sec.items.length,
                              total: matchedCounts[sec.key] ?? 0,
                              section: sec,
                            })
                          ) : (
                            <span>匹配较多，仅展示前{sec.items.length}条</span>
                          )}
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {dText && !hasAny && (
              <div className="p-6 text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gray-50 text-gray-300">
                  <Search className="mx-auto h-12 w-12 p-3" />
                </div>
                <div className="text-sm text-gray-600">没有找到匹配项</div>
                <div className="mt-1 text-xs text-gray-400">可以尝试更短的关键词或切换实体</div>
              </div>
            )}
          </div>
          {/* screen-reader polite notice for group limit */}
          <span aria-live="polite" className="sr-only">
            {groupLimitNotice ? `已达到最大条件组数（${maxFilterGroups}）` : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function Chip({ label, removable, onRemove }: { label: string; removable?: boolean; onRemove?: () => void }) {
  return (
    <span className="inline-flex max-w-[16rem] min-w-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
      <span className="min-w-0 truncate">{label}</span>
      {removable && (
        <button
          className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label="移除"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}

function PreviewCard({
  item,
  sectionLabel,
  placement,
}: {
  item: SuperSearchItem;
  sectionLabel: string;
  placement: PreviewPlacement;
}) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Animate in on mount
    const id = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      className={
        (placement === "bottom"
          ? "absolute left-1/2 top-full mt-2 w-72 -translate-x-1/2"
          : "absolute left-full top-1/2 ml-2 w-80 -translate-y-1/2") +
        " z-20 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-elevation-1 transition-all duration-150 ease-out transform-gpu " +
        (visible ? "opacity-100 scale-100" : "opacity-0 scale-95")
      }
      role="dialog"
      aria-label="预览"
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-400">
          {item.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs leading-none">{sectionLabel.slice(0, 1)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium leading-tight text-gray-900">{item.title}</div>
          {item.subtitle && <div className="mt-0.5 truncate text-xs leading-snug text-gray-500">{item.subtitle}</div>}
          {item.status && <div className="mt-1 inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">{item.status}</div>}
          {item.meta && (
            <div className="mt-2 space-y-1 text-xs leading-snug text-gray-600">
              {Object.entries(item.meta).map(([k2, v2]) => (
                <div key={k2} className="flex gap-2">
                  <span className="w-16 shrink-0 text-gray-400">{k2}</span>
                  <span className="truncate">{v2}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-start gap-3 pt-1 text-[11px] text-gray-500">
        <button
          className="text-primary/90 hover:underline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(item.id);
              setCopied(true);
              setTimeout(() => setCopied(false), 900);
            } catch {}
          }}
        >
          复制ID
        </button>
        {copied && <span className="text-gray-400">已复制</span>}
      </div>
    </div>
  );
}

function renderHighlight(text: string, q: string, _mode: HighlightMode) {
  if (!q) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "ig"));
  return (
    <>
      {parts.map((p, i) => {
        const hit = p.toLowerCase() === q.toLowerCase();
        return hit ? (
          <span key={i} className="text-orange-500">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        );
      })}
    </>
  );
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

