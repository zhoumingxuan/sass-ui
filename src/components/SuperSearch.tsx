"use client";

import { useEffect, useMemo, useRef, useState, ReactNode } from "react";
import Button from "./Button";
import { Search, X, Check } from "lucide-react";

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
};

export type SuperSearchProps = {
  placeholder?: string;
  sections: SuperSearchSection[];
  density?: Density;
  columns?: 2 | 3;
  preview?: PreviewPlacement;
  highlight?: HighlightMode;
  actions?: "hoverOnly" | "always";
  className?: string;
  history?: string[];
  hints?: string[];
  enablePreview?: boolean;
  previewDelay?: number;
  previewHideDelay?: number;
  selectable?: boolean;
  selectionMode?: "single" | "multiple";
  sectionSelectionMode?: Record<string, "single" | "multiple">;
  showSelectedBelow?: boolean;
  selected?: Record<string, SuperSearchItem[]>;
  onSelectionChange?: (sel: Record<string, SuperSearchItem[]>) => void;
  filterEntitySelectionMode?: "single" | "multiple";
  capCounts?: boolean;
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
  actions = "hoverOnly",
  className = "",
  history = [],
  hints = [],
  enablePreview = true,
  previewDelay = 120,
  previewHideDelay = 120,
  selectable = true,
  selectionMode = "multiple",
  sectionSelectionMode,
  showSelectedBelow = true,
  selected,
  onSelectionChange,
  filterEntitySelectionMode = "multiple",
  capCounts = true,
}: SuperSearchProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const dText = useDebounced(text, 160);
  const [activeSection, setActiveSection] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [chipsMode, setChipsMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedWithin, setFocusedWithin] = useState(false);
  const isControlled = selected !== undefined;
  const [innerSel, setInnerSel] = useState<Record<string, SuperSearchItem[]>>({});
  const selection = isControlled ? (selected as Record<string, SuperSearchItem[]>) : innerSel;
  const [activeEntities, setActiveEntities] = useState<string[]>([]);

  // Preview control
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (showTimer.current) window.clearTimeout(showTimer.current);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!dText) return sections.map((s) => ({ ...s, items: s.items.slice(0, 6) }));
    const q = dText.trim();
    return sections.map((s) => ({
      ...s,
      items: s.items
        .filter((it) => matchQuery(q, it.title + " " + (it.subtitle ?? "")))
        .slice(0, 10),
    }));
  }, [sections, dText]);

  // Matched counts before slicing for improved UX hints
  const matchedCounts = useMemo(() => {
    if (!dText) return Object.fromEntries(sections.map((s) => [s.key, s.items.length]));
    const q = dText.trim();
    return Object.fromEntries(
      sections.map((s) => [
        s.key,
        s.items.filter((it) => matchQuery(q, it.title + " " + (it.subtitle ?? ""))).length,
      ]),
    );
  }, [sections, dText]);

  function formatBadgeCount(n: number) {
    if (capCounts && n > 99) return "99+";
    return String(n);
  }

  const hasAny = filtered.some((s) => s.items.length > 0);
  const densityRow = density === "compact" ? "h-10" : "h-12";

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function moveHighlight(dir: 1 | -1) {
    const sec = filtered[activeSection];
    if (!sec) return;
    const len = sec.items.length;
    if (len === 0) return;
    setActiveIndex((i) => (i + dir + len) % len);
  }

  function switchSection(dir: 1 | -1) {
    const len = filtered.length;
    if (len <= 1) return;
    const next = (activeSection + dir + len) % len;
    setActiveSection(next);
    const targetLen = filtered[next]?.items.length ?? 0;
    setActiveIndex((i) => (targetLen === 0 ? 0 : Math.min(i, targetLen - 1)));
  }

  const gridCols = useMemo(() => {
    if (columns === 2) return "grid-cols-2";
    if (columns === 3) return "grid-cols-3";
    return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
  }, [columns]);

  function getSectionMode(key: string): "single" | "multiple" {
    return sectionSelectionMode?.[key] ?? selectionMode;
  }

  function commitSelection(secKey: string, item: SuperSearchItem) {
    if (!selectable) return;
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

  const selectedCount = Object.values(selection ?? {}).flat().length;

  function clearAllSelection() {
    const next: Record<string, SuperSearchItem[]> = {};
    if (isControlled) {
      onSelectionChange?.(next);
    } else {
      setInnerSel(next);
      onSelectionChange?.(next);
    }
  }

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
          if ((active && root.contains(active)) || (rt && root.contains(rt))) {
            setFocusedWithin(true);
          } else {
            setFocusedWithin(false);
          }
        }, 0);
      }}
    >
      {/* SearchInput */}
      <div
        className={`flex items-center gap-2 rounded-xl border border-gray-200 bg-white shadow-sm ${density === "compact" ? "h-10 px-3" : "h-12 px-4"}`}
        onClick={() => {
          if (!chipsMode) setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search className="h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (chipsMode) setOpen(false);
          }}
          onFocus={() => {
            if (!chipsMode) setOpen(true);
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm placeholder-gray-400 focus:outline-none"
        />
        {!chipsMode && selectedCount > 0 && (
          <span className="inline-flex items-center gap-0.5 select-none rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
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
            className="text-gray-600"
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
              clearAllSelection();
              setActiveEntities([]);
            }}
            className="text-gray-600"
          >
            转为筛选
          </Button>
        )}
      </div>

      {/* Filter mode panel */}
      {chipsMode && focusedWithin && (
        <div className={`mt-2 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-sm`}>
          <div className="flex flex-wrap items-center gap-2">
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
            {text && (
              <>
                <span className="text-xs text-gray-400">关键词</span>
                <Chip label={text} removable onRemove={() => setText("")} />
              </>
            )}
            <div className="ml-auto">
              <Button size={density === "compact" ? "small" : "medium"} appearance="ghost" variant="default" onClick={() => setText("")}>
                清空筛选
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Selected items bar (normal mode only) */}
      {showSelectedBelow && !chipsMode && focusedWithin && selectedCount > 0 && (
        <div className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
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
        <div className="absolute z-20 mt-2 w-full">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-elevation-1">
            {!dText && (
              <div className="p-3">
                {history.length > 0 && (
                  <>
                    <div className="mb-2 text-xs text-gray-500">历史记录</div>
                    <div className="space-y-1">
                      {history.slice(0, 6).map((h) => (
                        <button key={h} className="w-full rounded-lg px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                          {h}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {hints.length > 0 && (
                  <div className="mt-3 text-xs text-gray-400">
                    {hints.map((t, i) => (
                      <div key={i}>{t}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!!dText && (
              <div
                className={`grid gap-4 p-3 ${gridCols}`}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    moveHighlight(1);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    moveHighlight(-1);
                  } else if (e.key === "Tab") {
                    e.preventDefault();
                    switchSection(e.shiftKey ? -1 : 1);
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    const sec = filtered[activeSection];
                    const it = sec?.items[activeIndex];
                    if (sec && it) commitSelection(sec.key, it);
                  }
                }}
              >
                {filtered.map((sec, si) => (
                  <div key={sec.key} className="min-w-0">
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
                                ["--badge-fg" as any]: "#0A66C2",
                                ["--badge-bg" as any]: "#EAF3FF",
                                ["--badge-br" as any]: "#CDE1FF",
                              }}
                            >
                              {formatBadgeCount(matchedCounts[sec.key] ?? sec.items.length)}
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>

                    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
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
                                if (hideTimer.current) window.clearTimeout(hideTimer.current);
                                if (showTimer.current) window.clearTimeout(showTimer.current);
                                showTimer.current = window.setTimeout(() => setHoverKey(k), previewDelay);
                              }
                            }}
                            onMouseLeave={() => {
                              if (enablePreview) {
                                if (showTimer.current) window.clearTimeout(showTimer.current);
                                if (hideTimer.current) window.clearTimeout(hideTimer.current);
                                hideTimer.current = window.setTimeout(() => setHoverKey((prev) => (prev === k ? null : prev)), previewHideDelay);
                              }
                            }}
                          >
                            <button
                              className={`${baseRow} ${activeRing} ${activeTint} ${activeBold}`}
                              onMouseEnter={() => {
                                setActiveSection(si);
                                setActiveIndex(ii);
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

                      {false && sec.seeAllHref && sec.items.length > 0 && (
                        <li className="flex justify-end">
                          <a className="px-3 py-2 text-right text-xs text-gray-500 hover:text-gray-600" href={sec.seeAllHref} onClick={(e) => e.preventDefault()}>
                            查看全部 {sec.items.length} 条
                          </a>
                        </li>
                      )}
                      {dText && (matchedCounts[sec.key] ?? 0) > sec.items.length && (
                        <li className="flex justify-end">
                          <div className="px-3 py-2 text-right text-[11px] text-gray-400">
                            结果较多，继续输入以缩小范围
                          </div>
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
        </div>
      )}
    </div>
  );
}

function Chip({ label, removable, onRemove }: { label: string; removable?: boolean; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
      {label}
      {removable && (
        <button className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500" onClick={onRemove} aria-label="移除">
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

function renderHighlight(text: string, q: string, mode: HighlightMode) {
  if (!q) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "ig"));
  return (
    <>
      {parts.map((p, i) => {
        const hit = p.toLowerCase() === q.toLowerCase();
        if (!hit) return <span key={i}>{p}</span>;
        if (mode === "bold") return (
          <span key={i} className="font-semibold text-gray-900">
            {p}
          </span>
        );
        if (mode === "outline")
          return (
            <span key={i} className="rounded ring-1 ring-primary px-0.5">
              {p}
            </span>
          );
        return (
          <span key={i} className="rounded bg-primary/15 px-0.5 font-medium text-gray-900">
            {p}
          </span>
        );
      })}
    </>
  );
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

