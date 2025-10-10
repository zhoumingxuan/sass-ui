import {
  type CSSProperties,
  type KeyboardEvent,
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
  Status,
  InputSize,
  inputSize,
} from "../formStyles";
import { Check, ChevronDown, X } from "lucide-react";
import Pill from "@/components/Pill";

export type Option = { value: string; label: string; disabled?: boolean };

type BaseProps = {
  label?: string;
  helper?: string;
  options: Option[];
  placeholder?: string;
  clearable?: boolean;
  required?: boolean;
  className?: string;
  status?: Status;
  size?: InputSize;
  /**
   * If a fixed number is provided, always render that many tags.
   * Otherwise auto-fit by counting the first visual row after wrapping and resize.
   */
  maxTagCount?: number;
  showSelectedSummary?: boolean;
  pillCloseable?: boolean;
  summaryText?: (n: number) => string;
};

type SingleProps = BaseProps & {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

type MultiProps = BaseProps & {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
};

type Props = SingleProps | MultiProps;

type SelectVars = CSSProperties & { "--select-multi-reserve": string };

const RESERVE_VAR_MAP: Record<InputSize, string> = {
  sm: "var(--select-multi-reserve-sm)",
  md: "var(--select-multi-reserve-md)",
  lg: "var(--select-multi-reserve-lg)",
};

// Use the visible container itself for statistics; no hidden measuring layer.
const DISPLAY_GROUP_ATTR = "data-display-group";
const DISPLAY_PILL_ATTR = "data-display-pill"; // Wrapper span around Pill, used to read offsetTop/Height.

export default function Select(props: Props) {
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
    maxTagCount,
    pillCloseable = true,
    summaryText,
  } = props;

  const multiple = (props as MultiProps).multiple === true;
  const controlledValue = (props as any).value as string | string[] | undefined;
  const defaultValue = (props as any).defaultValue as string | string[] | undefined;
  const onChange = (props as any).onChange as ((value: string | string[]) => void) | undefined;

  const id = useId();
  const [internal, setInternal] = useState<string | string[] | undefined>(defaultValue);
  const isControlled = typeof controlledValue !== "undefined";
  const value = (isControlled ? controlledValue : internal) as string | string[] | undefined;

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [activeIndex, setActiveIndex] = useState(-1);

  const anchorRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listScrollRef = useRef(0);
  const enforceVisibilityRef = useRef(false);
  const [mountNode, setMountNode] = useState<Element | null>(null);

  const displayGroupRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(
    () => new Set(Array.isArray(value) ? value : value ? [value] : []),
    [value],
  );
  const selectedOptions = useMemo(
    () => options.filter(option => selectedSet.has(option.value)),
    [options, selectedSet],
  );
  const explicitLimit = typeof maxTagCount === "number" && maxTagCount >= 0 ? maxTagCount : null;
  const enableAutoCount = multiple && explicitLimit === null;
  const selectionKey = useMemo(
    () => selectedOptions.map(option => option.value).join("|"),
    [selectedOptions],
  );

  const itemTextClass = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  const hasSelection = multiple ? selectedOptions.length > 0 : typeof value === "string" && !!value;
  const textTone = hasSelection ? "text-gray-700" : "text-gray-400";

  const multiVars: SelectVars | undefined = multiple
    ? { "--select-multi-reserve": RESERVE_VAR_MAP[size] }
    : undefined;
  const reserveStyle = useMemo<CSSProperties>(
    () => ({ width: "var(--select-multi-reserve)", minWidth: "var(--select-multi-reserve)" }),
    [],
  );

  // Auto-fit the number of visible tags based on the first line (when no explicit max is provided).
  const [visibleCount, setVisibleCount] = useState(() => (enableAutoCount ? selectedOptions.length : 0));


  const labelText = !multiple
    ? (typeof value === "string" && value ? options.find(option => option.value === value)?.label ?? "" : "")
    : "";


  const commitSingle = useCallback(
    (next: string) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
      setOpen(false);
    },
    [isControlled, onChange],
  );

  const toggleMulti = useCallback(
    (nextValue: string, index: number) => {
      if (listRef.current) listScrollRef.current = listRef.current.scrollTop;
      enforceVisibilityRef.current = false;

      const current = Array.isArray(value) ? value : [];
      const next = current.includes(nextValue) ? current.filter(item => item !== nextValue) : [...current, nextValue];
      if (!isControlled) setInternal(next);
      onChange?.(next);
      setActiveIndex(index);
    },
    [isControlled, onChange, value],
  );

  const handleClearAll = useCallback(() => {
    if (multiple) {
      if (!isControlled) setInternal([]);
      onChange?.([]);
    } else {
      if (!isControlled) setInternal("");
      onChange?.("");
    }
  }, [isControlled, multiple, onChange]);

  const handlePillClose = useCallback(
    (target: string) => {
      if (!Array.isArray(value)) return;
      const filtered = value.filter(item => item !== target);
      if (!isControlled) setInternal(filtered);
      onChange?.(filtered);
    },
    [isControlled, onChange, value],
  );

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
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setPos({ top: rect.bottom + 4 + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
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
  }, []);

  useEffect(() => {
    if (!open) return;
    if (multiple) {
      if (activeIndex < 0 || activeIndex >= options.length) {
        const firstEnabled = options.findIndex(option => !option.disabled);
        setActiveIndex(firstEnabled >= 0 ? firstEnabled : 0);
      }
      return;
    }

    const selectedIndex = options.findIndex(option => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [activeIndex, multiple, open, options, value]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    if (!enforceVisibilityRef.current) return;
    const target = document.getElementById(`${id}-opt-${activeIndex}`);
    target?.scrollIntoView({ block: "nearest" });
    enforceVisibilityRef.current = false;
  }, [activeIndex, id, open]);

  const moveActive = useCallback(
    (delta: number) => {
      if (!open) setOpen(true);
      setActiveIndex(previous => {
        const length = options.length;
        if (length === 0) return -1;
        let next = previous;
        let safety = length;
        do {
          next = (next + delta + length) % length;
          safety -= 1;
        } while (options[next].disabled && safety > 0);
        return next;
      });
    },
    [open, options],
  );
  
  //设计一个计算函数，用useCallBack处理，内部参数随着选项更新
  const calNeedCount=useCallback(() => {
    if (!enableAutoCount) return;

    const group = displayGroupRef.current;
    if (!group) {
      setVisibleCount(0);
      return;
    }

    const pills = Array.from(group.querySelectorAll(`[${DISPLAY_PILL_ATTR}="true"]`)) as HTMLElement[];
    if (pills.length === 0) {
      setVisibleCount(0);
      return;
    }

    const firstTop = Math.min(...pills.map(el => el.offsetTop));
    const firstLineCount = pills.filter(el => el.offsetTop === firstTop).length;

    if (firstLineCount <= 0) {
      setVisibleCount(0);
      return;
    }

    setVisibleCount(firstLineCount);

  }, [enableAutoCount, selectedOptions.length, selectionKey]);

  useEffect(() => {
    if (!enableAutoCount) return;
    if (typeof ResizeObserver === "undefined") return;
    const group = displayGroupRef.current;
    if (!group) return;
    
    //初始化时候触发一次
    calNeedCount();

    const observer = new ResizeObserver(() => {
       //换行的时候触发一次
       calNeedCount();
    });

    observer.observe(group);
    return () => observer.disconnect();
  }, [enableAutoCount]);




  // Restore list scroll position after options render; do not use layout effect.
  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listScrollRef.current;
  }, [open, selectedOptions.length]);

  const renderMultiContent = () => {
    if (selectedOptions.length === 0) return placeholder ?? "";


    const rest = selectedOptions.length-visibleCount;

    return (
      <div className="flex h-full w-full items-center gap-2">
        {/* Reserve space for trailing icons / clear button */}
        <span aria-hidden className="pointer-events-none shrink-0" style={reserveStyle} />

        {/* Visible container: flex-wrap + h-full, only reveal the first line; no manual width measuring */}
        <div
          ref={displayGroupRef}
          className="ml-auto h-full flex min-w-0 flex-wrap items-center justify-end gap-2"
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
                <span className="truncate">{option.label}</span>
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
            "text-left flex items-start overflow-hidden",
            textTone,
            size === "lg" ? "pr-12" : size === "sm" ? "pr-8" : "pr-10",
          ]
            .filter(Boolean)
            .join(" ")}
          style={multiVars}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={status === "error" ? true : undefined}
          aria-controls={`${id}-listbox`}
        >
          {!multiple ? (labelText || placeholder || "") : renderMultiContent()}
        </div>

        {!multiple && clearable && value && (
          <a
            type="button"
            onClick={handleClearAll}
            aria-label="清空"
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} className="text-gray-500" aria-hidden />
          </a>
        )}

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <ChevronDown size={16} aria-hidden />
        </span>

        {open &&
          mountNode &&
          createPortal(
            <div
              ref={popRef}
              role="listbox"
              id={`${id}-listbox`}
              className="fixed z-[1200] max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-elevation-1"
              style={{ top: pos.top, left: pos.left, minWidth: pos.width } as CSSProperties}
              aria-multiselectable={multiple || undefined}
            >
              <div
                ref={listRef}
                onScroll={event => {
                  listScrollRef.current = event.currentTarget.scrollTop;
                }}
              >
                {options.map((option, index) => {
                  const selected = selectedSet.has(option.value);
                  const active = index === activeIndex;
                  const optionId = `${id}-opt-${index}`;
                  return (
                    <button
                      type="button"
                      id={optionId}
                      key={option.value}
                      role="option"
                      aria-disabled={option.disabled}
                      aria-selected={selected}
                      disabled={option.disabled}
                      className={[
                        "flex w-full items-center justify-between px-3 py-2",
                        itemTextClass,
                        option.disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-700",
                        active ? "bg-gray-100" : selected ? "bg-gray-50" : "hover:bg-gray-50",
                      ].join(" ")}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={() => {
                        if (listRef.current) listScrollRef.current = listRef.current.scrollTop;
                        enforceVisibilityRef.current = false;
                      }}
                      onClick={() => {
                        if (option.disabled) return;
                        if (multiple) {
                          toggleMulti(option.value, index);
                        } else {
                          commitSingle(option.value);
                        }
                      }}
                    >
                      <span className="truncate">{option.label}</span>
                      {selected && <Check size={16} className="text-primary" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </div>,
            mountNode,
          )}
      </div>

      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
