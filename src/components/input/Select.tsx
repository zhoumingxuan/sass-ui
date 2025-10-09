import {
  type CSSProperties,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
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
  maxTagCount?: number; // 若提供，走固定数量；未提供时走“首行自适应计数”
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

const MEASURE_GROUP_ATTR = "data-measure-group";
const MEASURE_PILL_ATTR = "data-measure-pill";
const MEASURE_PLUS_ATTR = "data-measure-plus";
const MEASURE_PLUS_LABEL_ATTR = "data-measure-plus-label";

const parseCssSizeToPx = (value: string, context: HTMLElement): number => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (trimmed.endsWith("px")) return parseFloat(trimmed);
  if (trimmed.endsWith("rem") || trimmed.endsWith("em")) {
    const factor = parseFloat(trimmed);
    const fontSize = parseFloat(getComputedStyle(context).fontSize || "16");
    if (!Number.isFinite(factor) || !Number.isFinite(fontSize)) return 0;
    return factor * fontSize;
  }
  const numeric = parseFloat(trimmed);
  return Number.isFinite(numeric) ? numeric : 0;
};

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
    showSelectedSummary,
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listScrollRef = useRef(0);
  const enforceVisibilityRef = useRef(false);
  const measureRef = useRef<HTMLDivElement>(null);
  const [mountNode, setMountNode] = useState<Element | null>(null);

  const selectedSet = useMemo(
    () => new Set(Array.isArray(value) ? value : value ? [value] : []),
    [value],
  );
  const selectedOptions = useMemo(
    () => options.filter(option => selectedSet.has(option.value)),
    [options, selectedSet],
  );
  const labelSet = useMemo(() => selectedOptions.map(option => option.label), [selectedOptions]);

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

  // “首行自适应计数”结果；如果用户传入 maxTagCount 则忽略该值
  const [autoCount, setAutoCount] = useState(() => (multiple ? selectedOptions.length : 0));
  const [isMeasured, setIsMeasured] = useState(!multiple || selectedOptions.length === 0);

  const labelText = !multiple
    ? (typeof value === "string" && value ? options.find(option => option.value === value)?.label ?? "" : "")
    : "";

  const summaryFormatter = useMemo(
    () => summaryText ?? ((count: number) => `已选${count}项`),
    [summaryText],
  );

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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        enforceVisibilityRef.current = true;
        moveActive(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        enforceVisibilityRef.current = true;
        moveActive(-1);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        if (activeIndex < 0 || activeIndex >= options.length) return;
        const option = options[activeIndex];
        if (option.disabled) return;
        if (multiple) {
          enforceVisibilityRef.current = true;
          toggleMulti(option.value, activeIndex);
        } else {
          commitSingle(option.value);
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key === "Backspace" && multiple) {
        if (Array.isArray(value) && value.length > 0) {
          handlePillClose(value[value.length - 1]);
        }
      }
    },
    [activeIndex, commitSingle, handlePillClose, moveActive, multiple, open, options, toggleMulti, value],
  );

  // —— 关键改造：按“换行触发→统计首行元素数”的思路做自适应 maxTagCount ——
  useLayoutEffect(() => {
    if (!multiple) return;
    const button = buttonRef.current;
    const measure = measureRef.current;
    if (!button || !measure) return;

    const group = measure.querySelector(`[${MEASURE_GROUP_ATTR}="true"]`) as HTMLElement | null;
    const plusEl = group?.querySelector(`[${MEASURE_PLUS_ATTR}="true"]`) as HTMLElement | null;
    const plusLabelEl = plusEl?.querySelector(`[${MEASURE_PLUS_LABEL_ATTR}="true"]`) as HTMLElement | null;

    const resolveReserveWidth = () => {
      const raw = getComputedStyle(button).getPropertyValue("--select-multi-reserve");
      return raw ? parseCssSizeToPx(raw, button) : 0;
    };

    const collectPills = () =>
      (group ? Array.from(group.querySelectorAll(`[${MEASURE_PILL_ATTR}="true"]`)) : []) as HTMLElement[];

    const updateMetrics = () => {
      const style = getComputedStyle(button);
      const contentWidth = button.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);

      if (!Number.isFinite(contentWidth) || contentWidth <= 0) {
        setAutoCount(0);
        setIsMeasured(true);
        return;
      }

      const pillEls = collectPills();
      if (pillEls.length === 0) {
        setAutoCount(0);
        setIsMeasured(true);
        return;
      }

      const reserveWidth = resolveReserveWidth();
      const available = Math.max(0, contentWidth - reserveWidth);

      // 将测量组的宽度“设成可用宽度”，并启用 wrap，以让项目自然换行
      if (group) {
        group.style.width = `${available}px`;
        group.style.maxWidth = `${available}px`;
        // 保底确保启用换行（JSX已写 flex-wrap，这里再兜底）
        group.style.display = "flex";
        (group.style as any).flexWrap = "wrap";
        group.style.overflow = "hidden"; // 多行仅显示首行
      }

      // 先假设不需要 +N，占位为 0；随后根据余量更新
      if (plusLabelEl) plusLabelEl.textContent = "+0";

      // 统计首行：取最小 offsetTop 为首行基线
      const firstTop = Math.min(...pillEls.map(el => el.offsetTop));
      let firstLineCount = pillEls.filter(el => el.offsetTop === firstTop).length;

      // 计算余量并让 +N 参与首行排版，若 +N 被挤到下一行，就递减首行可见数量直至 +N 回到首行
      let rest = Math.max(0, selectedOptions.length - firstLineCount);
      if (plusLabelEl) plusLabelEl.textContent = `+${rest}`;

      // 如果存在余量，确保 +N 也能位于首行
      if (rest > 0 && plusEl) {
        let safety = 128; // 防御性上限，避免极端情况下死循环
        while (safety-- > 0 && firstLineCount > 0 && plusEl.offsetTop > firstTop) {
          firstLineCount -= 1;
          rest = Math.max(0, selectedOptions.length - firstLineCount);
          if (plusLabelEl) plusLabelEl.textContent = `+${rest}`;
        }
      }

      const nextCount = Math.max(0, Math.min(firstLineCount, selectedOptions.length));
      setAutoCount(prev => (prev === nextCount ? prev : nextCount));
      setIsMeasured(true);
    };

    updateMetrics();

    // 仅在“尺寸变化/滚动/候选变化”时触发测量，避免实时抖动
    let frame: number | null = null;
    const schedule = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateMetrics);
    };

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    if (observer) observer.observe(button);

    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [multiple, options.length, selectedOptions.length, size]);

  useLayoutEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listScrollRef.current;
  }, [open, selectedOptions.length]);

  const renderMultiContent = () => {
    if (selectedOptions.length === 0) return placeholder ?? "";

    if (showSelectedSummary) {
      return (
        <div className="flex w-full items-center gap-2 overflow-hidden">
          {/* 右侧图标/清空预留 */}
          <span aria-hidden className="pointer-events-none shrink-0" style={reserveStyle} />
          <div className="ml-auto flex min-w-0 items-center justify-end gap-2 overflow-hidden">
            <Pill tone="primary" className="max-w-full shrink-0" closeable={!!clearable} onClose={handleClearAll}>
              {summaryFormatter(selectedOptions.length)}
            </Pill>
          </div>
        </div>
      );
    }

    const explicitLimit = typeof maxTagCount === "number" && maxTagCount >= 0 ? maxTagCount : null;
    const baseLimit = explicitLimit ?? (isMeasured ? autoCount : selectedOptions.length);
    const limit = Number.isFinite(baseLimit)
      ? Math.max(0, Math.min(selectedOptions.length, baseLimit))
      : selectedOptions.length;

    const visible = selectedOptions.slice(0, limit);
    const rest = selectedOptions.length - visible.length;

    return (
      <div className="flex w-full items-center gap-2 overflow-hidden">
        {/* 右侧图标/清空预留 */}
        <span aria-hidden className="pointer-events-none shrink-0" style={reserveStyle} />
        {/* 实际展示区：单行、不换行，超出隐藏；不做实时测算 */}
        <div className="ml-auto flex min-w-0 items-center justify-end gap-2 overflow-hidden">
          {visible.map(option => (
            <Pill
              key={option.value}
              tone="neutral"
              className="max-w-full shrink-0"
              closeable={pillCloseable}
              onClose={() => handlePillClose(option.value)}
            >
              <span className="truncate">{option.label}</span>
            </Pill>
          ))}
          {rest > 0 && (
            <Pill tone="primary" className="max-w-full shrink-0" aria-label={`还有 ${rest} 项`}>
              +{rest}
            </Pill>
          )}
        </div>
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

      {/* 隐形测量容器：启用换行，仅用于统计首行可容纳的 Pills 数量 */}
      {multiple && (
        <div
          ref={measureRef}
          className="pointer-events-none fixed left-0 top-0 -z-50 flex w-full items-center gap-2 opacity-0"
          style={multiVars}
          aria-hidden
        >
          <span aria-hidden className="pointer-events-none shrink-0" style={reserveStyle} />
          <div
            className="ml-auto flex min-w-0 items-center justify-end gap-2 overflow-hidden flex-wrap"
            data-measure-group="true"
          >
            {selectedOptions.map(option => (
              <Pill key={`measure-${option.value}`} tone="neutral" className="max-w-full shrink-0" data-measure-pill="true">
                {option.label}
              </Pill>
            ))}
            <Pill tone="primary" className="max-w-full shrink-0" data-measure-plus="true">
              <span data-measure-plus-label="true">+0</span>
            </Pill>
          </div>
        </div>
      )}

      <div ref={anchorRef} className={`relative ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          id={id}
          onClick={() => setOpen(previous => !previous)}
          onKeyDown={handleKeyDown}
          onFocus={event => {
            if (event.currentTarget.matches(":focus-visible")) setOpen(true);
          }}
          className={[
            inputBase,
            inputSize[size],
            status ? inputStatus[status] : "",
            "text-left flex items-center",
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
        </button>

        {!multiple && clearable && value && (
          <button
            type="button"
            onClick={handleClearAll}
            aria-label="清空"
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} className="text-gray-500" aria-hidden />
          </button>
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
              className="fixed z-[1200] max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-elevation-1"
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
