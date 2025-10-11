import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  inputBase,
  fieldLabel,
  helperText,
  inputStatus,
  type Status,
  inputSize,
  type InputSize,
} from "../formStyles";
import Pill from "@/components/Pill";
import type { Option } from "./Select";
import { ChevronDown, ChevronLeft, ChevronRight, Search as SearchIcon } from "lucide-react";

type MultiValue = string[] | Option[] | undefined;

type FilterDirection = "source" | "target";

type FilterOption = (query: string, option: Option, direction: FilterDirection) => boolean;

type TransferSelectProps = {
  label?: string;
  helper?: string;
  options: Option[];
  value?: MultiValue;
  defaultValue?: MultiValue;
  onChange?: (value: MultiValue) => void;
  placeholder?: string;
  clearable?: boolean;
  required?: boolean;
  className?: string;
  status?: Status;
  size?: InputSize;
  pillCloseable?: boolean;
  labelAndValue?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: { source?: string; target?: string };
  sourceTitle?: string;
  targetTitle?: string;
  emptyText?: { source?: string; target?: string };
  filterOption?: FilterOption;
};

type SelectVars = CSSProperties & { "--select-multi-reserve": string };

const RESERVE_VAR_MAP: Record<InputSize, string> = {
  sm: "var(--select-multi-reserve-sm)",
  md: "var(--select-multi-reserve-md)",
  lg: "var(--select-multi-reserve-lg)",
};

const DISPLAY_PILL_ATTR = "data-display-pill";

const MIN_PANEL_WIDTH = 520;

const defaultFilter: FilterOption = (query, option) => {
  if (!query) return true;
  const merged = `${option.title ?? ""} ${option.label ?? ""}`.toLowerCase();
  return merged.includes(query);
};

export default function TransferSelect(props: TransferSelectProps) {
  const {
    label,
    helper,
    options,
    placeholder,
    clearable,
    className = "",
    required,
    status,
    size = "md",
    pillCloseable = true,
    labelAndValue = false,
    showSearch = true,
    searchPlaceholder,
    sourceTitle = "可选项",
    targetTitle = "已选项",
    emptyText,
    filterOption,
  } = props;

  const { value: controlledValue, defaultValue, onChange } = props;

  const id = useId();
  const [internal, setInternal] = useState<MultiValue | undefined>(defaultValue);
  const isControlled = typeof controlledValue !== "undefined";
  const rawValue = (isControlled ? controlledValue : internal) as MultiValue;

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const anchorRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const displayGroupRef = useRef<HTMLDivElement>(null);
  const [mountNode, setMountNode] = useState<Element | null>(null);

  const [autoVisibleCount, setAutoVisibleCount] = useState(-1);

  const selectionKeys = useMemo(() => {
    if (!rawValue) return [] as string[];
    if (Array.isArray(rawValue)) {
      return rawValue
        .map(item => (typeof item === "string" ? item : item?.value))
        .filter((key): key is string => Boolean(key));
    }
    return [] as string[];
  }, [rawValue]);

  const optionMap = useMemo(() => {
    const map = new Map<string, Option>();
    options.forEach(option => map.set(option.value, option));
    return map;
  }, [options]);

  const selectedOptions = useMemo(() => {
    return selectionKeys
      .map(key => optionMap.get(key))
      .filter((option): option is Option => Boolean(option));
  }, [optionMap, selectionKeys]);

  const selectionSet = useMemo(() => new Set(selectionKeys), [selectionKeys]);

  const textTone = selectionKeys.length > 0 ? "text-gray-700" : "text-gray-400";
  const sizePadding =
    size === "lg" ? "pr-12" : size === "sm" ? "pr-8" : "pr-10";

  const multiVars: SelectVars = { "--select-multi-reserve": RESERVE_VAR_MAP[size] };
  const reserveStyle = useMemo<CSSProperties>(
    () => ({ width: "var(--select-multi-reserve)", minWidth: "var(--select-multi-reserve)" }),
    [],
  );

  const buildMultiPayload = useCallback(
    (keys: string[]): MultiValue => {
      if (!labelAndValue) return keys as MultiValue;
      return keys
        .map(key => optionMap.get(key))
        .filter((option): option is Option => Boolean(option));
    },
    [labelAndValue, optionMap],
  );

  const commitValue = useCallback(
    (keys: string[]) => {
      const payload = buildMultiPayload(keys);
      if (!isControlled) setInternal(payload);
      onChange?.(payload);
    },
    [buildMultiPayload, isControlled, onChange],
  );

  const handleClearAll = useCallback(() => {
    if (selectionKeys.length === 0) return;
    commitValue([]);
  }, [commitValue, selectionKeys.length]);

  const handlePillClose = useCallback(
    (target: string) => {
      if (!selectionSet.has(target)) return;
      commitValue(selectionKeys.filter(item => item !== target));
    },
    [commitValue, selectionKeys, selectionSet],
  );

  const calNeedCount = useCallback(() => {
    const group = displayGroupRef.current;
    if (!group) {
      setAutoVisibleCount(-1);
      return;
    }

    const pills = Array.from(group.querySelectorAll(`[${DISPLAY_PILL_ATTR}="true"]`)) as HTMLElement[];
    if (!pills.length) {
      setAutoVisibleCount(-1);
      return;
    }

    const tops = pills.map(el => el.offsetTop);
    const minTop = Math.min(...tops);
    const maxTop = Math.max(...tops);
    if (minTop === maxTop) {
      setAutoVisibleCount(-1);
      return;
    }

    const firstLineCount = pills.filter(el => el.offsetTop === minTop).length;
    if (firstLineCount <= 0) {
      setAutoVisibleCount(-1);
      return;
    }

    setAutoVisibleCount(firstLineCount);
  }, [selectionKeys.length]);

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (!popRef.current || !anchorRef.current) return;
      if (popRef.current.contains(event.target as Node) || anchorRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setMountNode(document.getElementById("layout-body") || document.body);
    }
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      calNeedCount();
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const viewportWidth = window.innerWidth;
      const width = Math.max(rect.width, MIN_PANEL_WIDTH);
      const minLeft = scrollX + 8;
      const maxLeft = Math.max(minLeft, scrollX + viewportWidth - width - 8);
      const desiredLeft = rect.left + scrollX;
      const left = Math.min(Math.max(desiredLeft, minLeft), maxLeft);
      setPos({ top: rect.bottom + scrollY, left, width });
    };

    updatePosition();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updatePosition) : null;
    if (observer && anchorRef.current) observer.observe(anchorRef.current);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [calNeedCount]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const group = displayGroupRef.current;
    if (!group) return;

    calNeedCount();

    const observer = new ResizeObserver(() => {
      calNeedCount();
    });
    observer.observe(group);
    return () => observer.disconnect();
  }, [calNeedCount, selectionKeys.length]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const [sourceQuery, setSourceQuery] = useState("");
  const [targetQuery, setTargetQuery] = useState("");

  const effectiveFilter = filterOption ?? defaultFilter;

  const filteredSourceItems = useMemo(() => {
    const query = showSearch ? sourceQuery.trim().toLowerCase() : "";
    return options.filter(option => {
      if (selectionSet.has(option.value)) return false;
      if (!showSearch || !query) return true;
      return effectiveFilter(query, option, "source");
    });
  }, [effectiveFilter, options, selectionSet, showSearch, sourceQuery]);

  const filteredTargetItems = useMemo(() => {
    const query = showSearch ? targetQuery.trim().toLowerCase() : "";
    return selectedOptions.filter(option => {
      if (!showSearch || !query) return true;
      return effectiveFilter(query, option, "target");
    });
  }, [effectiveFilter, selectedOptions, showSearch, targetQuery]);

  const [sourceSelected, setSourceSelected] = useState<string[]>([]);
  const [targetSelected, setTargetSelected] = useState<string[]>([]);

  useEffect(() => {
    setSourceSelected(prev => prev.filter(key => !selectionSet.has(key)));
    setTargetSelected(prev => prev.filter(key => selectionSet.has(key)));
  }, [selectionSet]);

  useEffect(() => {
    if (!open) {
      setSourceSelected([]);
      setTargetSelected([]);
      setSourceQuery("");
      setTargetQuery("");
    }
  }, [open]);

  const addKeys = useCallback(
    (keys: string[]) => {
      if (!keys.length) return;
      const nextSet = new Set(selectionKeys);
      keys.forEach(key => nextSet.add(key));
      const nextKeys = options
        .map(option => option.value)
        .filter(value => nextSet.has(value));
      commitValue(nextKeys);
    },
    [commitValue, options, selectionKeys],
  );

  const removeKeys = useCallback(
    (keys: string[]) => {
      if (!keys.length) return;
      const removeSet = new Set(keys);
      const nextKeys = selectionKeys.filter(key => !removeSet.has(key));
      commitValue(nextKeys);
    },
    [commitValue, selectionKeys],
  );

  const handleMoveToTarget = () => {
    if (!sourceSelected.length) return;
    const available = sourceSelected.filter(key => {
      const option = optionMap.get(key);
      return option && !option.disabled;
    });
    addKeys(available);
    setSourceSelected([]);
  };

  const handleMoveToSource = () => {
    if (!targetSelected.length) return;
    removeKeys(targetSelected);
    setTargetSelected([]);
  };

  const handleSourceToggle = (key: string, disabled?: boolean) => {
    if (disabled) return;
    setSourceSelected(prev => (prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]));
  };

  const handleTargetToggle = (key: string) => {
    setTargetSelected(prev => (prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]));
  };

  const handleSourceDoubleClick = (key: string, disabled?: boolean) => {
    if (disabled) return;
    addKeys([key]);
  };

  const handleTargetDoubleClick = (key: string) => {
    removeKeys([key]);
  };

  const rest = useMemo(() => {
    return autoVisibleCount < 0 ? -1 : Math.max(selectionKeys.length - autoVisibleCount, 0);
  }, [autoVisibleCount, selectionKeys.length]);

  const renderMultiContent = () => {
    if (selectionKeys.length === 0) {
      return (
        <div className="flex h-full w-full items-center gap-2">
          <span aria-hidden className="pointer-events-none shrink-0" style={reserveStyle} />
          <span className="ml-auto block min-w-0 truncate text-gray-400">{placeholder ?? ""}</span>
        </div>
      );
    }

    return (
      <div className="flex h-full w-full items-center gap-2">
        <span aria-hidden className="pointer-events-none shrink-0" style={reserveStyle} />
        <div
          ref={displayGroupRef}
          className="ml-auto flex h-full min-w-0 flex-wrap items-center justify-end gap-2"
          data-display-group="true"
        >
          {selectedOptions.map(option => (
            <span
              key={option.value}
              data-display-pill="true"
              className="flex h-full max-w-full shrink-0 items-center justify-center py-1"
            >
              <Pill
                tone="neutral"
                className="max-w-full shrink-0"
                closeable={pillCloseable}
                onClose={() => handlePillClose(option.value)}
              >
                <span className="truncate">{option.title ?? option.label}</span>
              </Pill>
            </span>
          ))}
        </div>
        {rest > 0 && (
          <span className="inline-flex max-w-full shrink-0">
            <Pill tone="primary" className="max-w-full shrink-0" aria-label={`还有 ${rest} 项`}>
              <span>+{rest}</span>
            </Pill>
          </span>
        )}
        {clearable && selectionKeys.length > 0 && (
          <a
            href="#"
            onClick={event => {
              event.preventDefault();
              handleClearAll();
            }}
            aria-label="清空"
            className={`whitespace-nowrap text-xs font-medium text-gray-400 hover:text-gray-600 ${open ? "" : "hidden"}`}
          >
            清空
          </a>
        )}
      </div>
    );
  };

  const searchPlaceholders = {
    source: searchPlaceholder?.source ?? "搜索可选项",
    target: searchPlaceholder?.target ?? "搜索已选项",
  };

  const emptyMessages = {
    source: emptyText?.source ?? "暂无数据",
    target: emptyText?.target ?? "暂无数据",
  };

  const renderList = (
    list: Option[],
    selected: string[],
    onToggle: (key: string, disabled?: boolean) => void,
    onDouble: (key: string, disabled?: boolean) => void,
    direction: FilterDirection,
  ) => {
    if (!list.length) {
      return (
        <div className="flex h-full items-center justify-center px-3 text-sm text-gray-400">
          {emptyMessages[direction]}
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col gap-1 py-1">
        {list.map(option => {
          const checked = selected.includes(option.value);
          const disabled = Boolean(option.disabled);
          return (
            <label
              key={option.value}
              className={[
                "flex cursor-pointer select-none items-center gap-2 rounded px-3 py-2 text-sm transition-colors",
                disabled ? "cursor-not-allowed text-gray-300" : "hover:bg-gray-50 text-gray-700",
                checked ? "bg-primary/5 text-primary" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onDoubleClick={() => onDouble(option.value, option.disabled)}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(option.value, option.disabled)}
              />
              <span className="min-w-0 flex-1 truncate">{option.title ?? option.label}</span>
            </label>
          );
        })}
      </div>
    );
  };

  return (
    <label className="block">
      {label && (
        <span className={fieldLabel}>
          {label}
          {required ? <span className="ml-0.5 text-error">*</span> : null}
        </span>
      )}

      <div ref={anchorRef} className={`relative ${className}`}>
        <div
          id={id}
          onClick={() => setOpen(previous => !previous)}
          onFocus={event => {
            if (event.currentTarget.matches(":focus-visible")) setOpen(true);
          }}
          className={[
            inputBase,
            inputSize[size],
            status ? inputStatus[status] : "",
            "flex items-center overflow-hidden text-left",
            textTone,
            sizePadding,
            open ? "rounded-none rounded-t-lg border-b-0" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={multiVars}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={`${id}-transfer-panel`}
        >
          {renderMultiContent()}
        </div>

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <ChevronDown size={16} aria-hidden />
        </span>

        {open &&
          mountNode &&
          createPortal(
            <div
              ref={popRef}
              role="dialog"
              id={`${id}-transfer-panel`}
              aria-modal="false"
              className="fixed z-[1200] max-h-[28rem] rounded-b-lg border border-gray-200 bg-white shadow-elevation-1"
              style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
            >
              <div className="grid h-full max-h-[28rem] grid-cols-[1fr_auto_1fr] gap-4 p-4">
                <div className="flex min-h-[16rem] flex-col">
                  <div className="mb-2 text-sm font-medium text-gray-700">
                    {sourceTitle}（{filteredSourceItems.length}）
                  </div>
                  {showSearch && (
                    <div className="relative mb-2">
                      <input
                        type="text"
                        value={sourceQuery}
                        onChange={event => setSourceQuery(event.target.value)}
                        placeholder={searchPlaceholders.source}
                        className={[inputBase, inputSize.sm, "pl-8 pr-8 text-xs"].join(" ")}
                      />
                      <SearchIcon
                        size={14}
                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                        aria-hidden
                      />
                    </div>
                  )}
                  <div className="flex-1 overflow-auto rounded border border-gray-200">
                    {renderList(filteredSourceItems, sourceSelected, handleSourceToggle, handleSourceDoubleClick, "source")}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleMoveToTarget}
                    disabled={!sourceSelected.length}
                    className={[
                      "inline-flex h-9 w-9 items-center justify-center rounded border text-gray-600 transition-colors",
                      "border-gray-200 bg-white hover:bg-gray-50",
                      "disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300 disabled:bg-gray-50",
                    ].join(" ")}
                    aria-label="移动到右侧"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleMoveToSource}
                    disabled={!targetSelected.length}
                    className={[
                      "inline-flex h-9 w-9 items-center justify-center rounded border text-gray-600 transition-colors",
                      "border-gray-200 bg-white hover:bg-gray-50",
                      "disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300 disabled:bg-gray-50",
                    ].join(" ")}
                    aria-label="移动到左侧"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>

                <div className="flex min-h-[16rem] flex-col">
                  <div className="mb-2 text-sm font-medium text-gray-700">
                    {targetTitle}（{filteredTargetItems.length}/{selectionKeys.length}）
                  </div>
                  {showSearch && (
                    <div className="relative mb-2">
                      <input
                        type="text"
                        value={targetQuery}
                        onChange={event => setTargetQuery(event.target.value)}
                        placeholder={searchPlaceholders.target}
                        className={[inputBase, inputSize.sm, "pl-8 pr-8 text-xs"].join(" ")}
                      />
                      <SearchIcon
                        size={14}
                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                        aria-hidden
                      />
                    </div>
                  )}
                  <div className="flex-1 overflow-auto rounded border border-gray-200">
                    {renderList(filteredTargetItems, targetSelected, handleTargetToggle, handleTargetDoubleClick, "target")}
                  </div>
                </div>
              </div>
            </div>,
            mountNode,
          )}
      </div>

      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
