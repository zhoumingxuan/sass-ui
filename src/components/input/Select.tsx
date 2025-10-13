import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
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

export type Option = {
  value: string;
  label: string;
  title?: string;
  disabled?: boolean;
  /** 副标题（次级信息，单行截断） */
  subtitle?: string;
  /** 左侧前缀（如图标/头像），可选 */
  leading?: ReactNode;
  /** 右侧后缀（如徽标/状态点），可选；选中对勾依然保留在最右侧 */
  trailing?: ReactNode;
};

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
  pillCloseable?: boolean;
  labelAndValue?: boolean;
  renderPreview?: (option: Option) => ReactNode;
  /** 下拉项展示风格：默认扁平（单行），或列表风格（标题/副标题/说明） */
  itemVariant?: "default" | "list";
};

type SingleValue = string | Option | undefined;
type MultiValue = string[] | Option[] | undefined;

type SingleProps = BaseProps & {
  multiple?: false;
  value?: SingleValue;
  defaultValue?: SingleValue;
  onChange?: (value: SingleValue) => void;
};

type MultiProps = BaseProps & {
  multiple: true;
  value?: MultiValue;
  defaultValue?: MultiValue;
  onChange?: (value: MultiValue) => void;
};

type Props = SingleProps | MultiProps;
type ValueProps = {
  value?: SingleValue | MultiValue;
  defaultValue?: SingleValue | MultiValue;
  onChange?: (value: SingleValue | MultiValue) => void;
};

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
    pillCloseable = true,
    renderPreview,
    itemVariant = "default",
  } = props;

  const { value: controlledValue, defaultValue, onChange } = props as ValueProps;
  const multiple = props.multiple === true;
  const labelAndValue = props.labelAndValue === true;

  const id = useId();
  const [internal, setInternal] = useState<SingleValue | MultiValue | undefined>(defaultValue);
  const isControlled = typeof controlledValue !== "undefined";
  const rawValue = (isControlled ? controlledValue : internal) as SingleValue | MultiValue | undefined;

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [activeIndex, setActiveIndex] = useState(-1);
  const [previewAt, setPreviewAt] = useState<{ top: number; left: number } | null>(null);
  const [previewOption, setPreviewOption] = useState<Option | null>(null);

  const anchorRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listScrollRef = useRef(0);
  const enforceVisibilityRef = useRef(false);
  const [mountNode, setMountNode] = useState<Element | null>(null);

  const displayGroupRef = useRef<HTMLDivElement>(null);

  const selectionKeys = useMemo(() => {
    if (rawValue == null) return [];
    if (Array.isArray(rawValue)) {
      const list = rawValue
        .map(item => (typeof item === "string" ? item : item?.value))
        .filter((key): key is string => Boolean(key));
      return multiple ? list : list.slice(0, 1);
    }
    const singleKey = typeof rawValue === "string" ? rawValue : rawValue.value;
    return singleKey ? [singleKey] : [];
  }, [multiple, rawValue]);

  const selectedOptions = useMemo(
    () => options.filter(option => selectionKeys.includes(option.value)),
    [options, selectionKeys],
  );
  // 多选恒定自适应（不再使用 maxTagCount 固定数量）
  const enableAutoCount = multiple;

  const itemTextClass = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  const itemPadding = size === "sm" ? "py-1.5" : size === "lg" ? "py-3" : "py-2";
  const isList = itemVariant === "list";
  const hasSelection = selectionKeys.length > 0 ;
  const textTone = hasSelection ? "text-gray-700" : "text-gray-400";

  const multiVars: SelectVars | undefined = multiple
    ? { "--select-multi-reserve": RESERVE_VAR_MAP[size] }
    : undefined;
  const reserveStyle = useMemo<CSSProperties>(
    () => ({ width: "var(--select-multi-reserve)", minWidth: "var(--select-multi-reserve)" }),
    [],
  );

  // Auto-fit the number of visible tags based on the first line (when no explicit max is provided).
  const [autoVisibleCount, setAutoVisibleCount] = useState(-1);

  const currentSingleKey = !multiple ? selectionKeys[0] : undefined;
  const currentSingleOption = !multiple && currentSingleKey
    ? options.find(option => option.value === currentSingleKey)
    : undefined;

  const labelText = !multiple
    ? currentSingleOption
      ? currentSingleOption.title ?? currentSingleOption.label ?? ""
      : ""
    : "";


  const buildMultiPayload = useCallback(
    (keys: string[]): MultiValue => {
      if (!labelAndValue) return keys as MultiValue;
      return keys
        .map(key => options.find(option => option.value === key))
        .filter((option): option is Option => Boolean(option)) as MultiValue;
    },
    [labelAndValue, options],
  );

  const commitSingle = useCallback(
    (next: string) => {
      const option = options.find(item => item.value === next);
      const payload = (labelAndValue ? option : next) as SingleValue;
      if (!isControlled) setInternal(payload);
      onChange?.(payload);
      setOpen(false);
    },
    [isControlled, labelAndValue, onChange, options],
  );

  const toggleMulti = useCallback(
    (nextValue: string, index: number) => {
      if (listRef.current) listScrollRef.current = listRef.current.scrollTop;
      enforceVisibilityRef.current = false;

      const exists = selectionKeys.includes(nextValue);
      const nextKeys = exists
        ? selectionKeys.filter(item => item !== nextValue)
        : [...selectionKeys, nextValue];
      const payload = buildMultiPayload(nextKeys);
      if (!isControlled) setInternal(payload);
      onChange?.(payload);
      setActiveIndex(index);
    },
    [buildMultiPayload, isControlled, onChange, selectionKeys],
  );

  const handleClearAll = useCallback(() => {
    if (multiple) {
      const nextValue = buildMultiPayload([]);
      if (!isControlled) setInternal(nextValue);
      onChange?.(nextValue);
      return;
    }
    const nextValue = (labelAndValue ? undefined : "") as SingleValue;
    if (!isControlled) setInternal(nextValue);
    onChange?.(nextValue);

  }, [buildMultiPayload, isControlled, labelAndValue, multiple, onChange]);

  const handlePillClose = useCallback(
    (target: string) => {
      if (!multiple) return;
      const nextKeys = selectionKeys.filter(item => item !== target);
      const payload = buildMultiPayload(nextKeys);
      if (!isControlled) setInternal(payload);
      onChange?.(payload);
    },
    [buildMultiPayload, isControlled, multiple, onChange, selectionKeys],
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

    //设计一个计算函数，用useCallBack处理，内部参数随着选项更新
  const calNeedCount=useCallback(() => {
    if (!enableAutoCount) return;

    const group = displayGroupRef.current;
    if (!group) {
      setAutoVisibleCount(-1);
      return;
    }

    const pills = Array.from(group.querySelectorAll(`[${DISPLAY_PILL_ATTR}="true"]`)) as HTMLElement[];
    if (pills.length === 0) {
      setAutoVisibleCount(-1);
      return;
    }

    
    const topsArr=[...pills.map(el => el.offsetTop)];

    const minTop = Math.min(...topsArr);
    const maxTop = Math.max(...topsArr);

    if(minTop===maxTop)
    {
        setAutoVisibleCount(-1);
        return;
    }

    const firstLineCount = pills.filter(el => el.offsetTop === minTop).length;

    if (firstLineCount <= 0) {
      setAutoVisibleCount(-1);
      return;
    }

    setAutoVisibleCount(firstLineCount);

  }, [enableAutoCount, selectionKeys,selectionKeys.length]);

  useEffect(() => {
    const updatePosition = () => {
      calNeedCount()
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
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
        setActiveIndex(firstEnabled >= 0 ? firstEnabled : -1);
      }
      return;
    }

    const selectedIndex = options.findIndex(option => option.value === currentSingleKey);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : -1);
  }, [activeIndex, currentSingleKey, multiple, open, options]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    if (!enforceVisibilityRef.current) return;
    const target = document.getElementById(`${id}-opt-${activeIndex}`);
    target?.scrollIntoView({ block: "nearest" });
    enforceVisibilityRef.current = false;
  }, [activeIndex, id, open]);


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
  }, [open, selectionKeys.length]);

  // Fix preview card position relative to dropdown
  useEffect(() => {
    if (!open || !renderPreview) {
      setPreviewAt(null);
      setPreviewOption(null);
      return;
    }
    setPreviewAt({ top: pos.top, left: pos.left + pos.width + 4 });
  }, [open, renderPreview, pos.top, pos.left, pos.width]);

  // 跟随列表滚动/窗口尺寸更新预览位置（仅开启预览时）
  useEffect(() => {
    if (!open || !renderPreview || activeIndex < 0) return;
    const update = () => {
      const el = document.getElementById(`${id}-opt-${activeIndex}`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const drop = popRef.current?.getBoundingClientRect();
      const right = drop?drop.right:0;
      
      setPreviewAt({ top: r.top + window.scrollY, left: right+5+ window.scrollX });
    };
    update();
    const onScroll = () => update();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [activeIndex, id, open, renderPreview]);

  
  const rest = useMemo(() => {
    return autoVisibleCount < 0 ? -1 : (selectionKeys.length - autoVisibleCount);
  }, [autoVisibleCount, selectionKeys]);

  const renderMultiContent = () => {
    // 空态时也按与已选态一致的布局，保证占位与省略号表现正确
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
        {multiple && clearable && selectionKeys.length > 0 && (
          <a
            href="#"
            onClick={event => {
              event.preventDefault();
              handleClearAll();
            }}
            aria-label="清空"
            className={`whitespace-nowrap text-xs font-medium text-gray-400 hover:text-gray-600 ${open?"":"hidden"}`}
          >
            清空
          </a>
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
            "text-left flex items-center overflow-hidden",
            textTone,
            open? "rounded-none rounded-t-lg border-b-0":"",
            // 单选且可清空时为右侧清空+箭头多留出少量空间
            size === "lg"
              ? (!multiple && clearable && selectionKeys.length > 0 ? "pr-14" : "pr-12")
              : size === "sm"
              ? (!multiple && clearable && selectionKeys.length > 0 ? "pr-10" : "pr-8")
              : (!multiple && clearable && selectionKeys.length > 0 ? "pr-12" : "pr-10"),
          ]
            .filter(Boolean)
            .join(" ")}
          style={multiVars}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={status === "error" ? true : undefined}
          aria-controls={`${id}-listbox`}
        >
          {!multiple ? (
            <span className="block min-w-0 truncate">{labelText || placeholder || ""}</span>
          ) : (
            renderMultiContent()
          )}
        </div>

        {!multiple && clearable && selectionKeys.length > 0 && open  && (
          <a
            href="#"
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              handleClearAll();
            }}
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
              className="fixed z-[1200] max-h-56 overflow-auto border-t-gray-20 rounded-b-lg border border-gray-200 bg-white shadow-elevation-1 nice-scrollbar"
              style={{ top: pos.top, left: pos.left, minWidth: pos.width, ['--sb-track']: 'transparent' } as unknown as CSSProperties}
              aria-multiselectable={multiple || undefined}
            >
              <div
                ref={listRef}
                onScroll={event => {
                  listScrollRef.current = event.currentTarget.scrollTop;
                }}
              >
                {options.map((option, index) => {
                  const selected = selectionKeys.includes(option.value);
                  const active = index === activeIndex;
                  const optionId = `${id}-opt-${index}`;
                  return (
                    <div
                      id={optionId}
                      key={option.value}
                      role="option"
                      aria-disabled={option.disabled}
                      aria-selected={selected}
                      className={[
                        isList?"flex w-full px-3 transition-colors text-left":"flex w-full items-center justify-between px-3 transition-colors text-left",
                        itemPadding,
                        itemTextClass,
                        selected ? "bg-primary/5 text-gray-900" : "",
                        option.disabled? "cursor-not-allowed":"",
                        active ? "bg-gray-100" : "hover:bg-gray-50",
                        isList ? "items-start" : "items-center justify-between",
                      ].join(" ")}
                      onMouseEnter={() => {
                        setActiveIndex(index);
                        if (renderPreview) setPreviewOption(option);
                      }}
                      onMouseLeave={() => {
                        if (renderPreview) setPreviewOption(null);
                      }}
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
                      {isList ? (
                        // 列表风格：左中右布局（leading | 文本块 | trailing  选中勾）
                        <div className="flex w-full items-start gap-3">
                          {/* 左侧可选前缀 */}
                          {option.leading ? (
                            <span className="shrink-0 mt-0.5">{option.leading}</span>
                          ) : null}

                          {/* 中间文本块（标题/副标题/说明） */}
                          <div className="min-w-0 flex-1 whitespace-normal break-words">
                            <div className="flex items-baseline gap-2">
                              <div className={["truncate font-medium", itemTextClass,option.disabled ? "text-gray-300" : ""].join(" ")}>
                                {option.title ?? option.label}
                              </div>
                            </div>
                            {option.subtitle ? (
                              <div className={["mt-0.5 truncate text-xs",option.disabled ? "text-gray-300" : "text-gray-400"].join(" ")}>{option.subtitle}</div>
                            ) : null}
                          </div>

                          {/* 右侧可选后缀 */}
                          {option.trailing ? <span className={["shrink-0 text-xs",option.disabled ? "text-gray-300" : "text-gray-400"].join(" ")}>{option.trailing}</span> : null}

                          {/* 最右侧选中勾 */}
                          {selected && <Check size={16} className="shrink-0 text-primary" aria-hidden />}
                        </div>
                      ) : (
                        <>
                          <span className={["truncate",option.disabled ? "text-gray-300" : "",].join(" ")}>{option.label}</span>
                          {selected && <Check size={16} className="text-primary" aria-hidden />}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {renderPreview && previewOption && previewAt && (
                <div
                  className="fixed z-[1201] rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-elevation-2-left whitespace-normal break-words"
                  style={{ top: previewAt.top, left: previewAt.left } as CSSProperties}
                >
                  {renderPreview(previewOption)}
                </div>
              )}
            </div>,
            mountNode,
          )}
      </div>

      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
