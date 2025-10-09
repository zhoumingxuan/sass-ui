import { CSSProperties, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { inputBase, fieldLabel, helperText, inputStatus, Status, InputSize, inputSize } from "../formStyles";
import { Check, ChevronDown, X } from "lucide-react";
import Pill from "@/components/Pill";

export type Option = { value: string; label: string; disabled?: boolean };

type BaseProps = {
  label?: string;
  helper?: string;
  options: Option[];
  placeholder?: string;
  clearable?: boolean;          // 单选时显示右侧清空按钮；多选时不显示（关闭在 pill 内）
  required?: boolean;
  className?: string;
  status?: Status;
  size?: InputSize;             // lg | md | sm

  /** —— 多选展示能力 —— */
  maxTagCount?: number;         // 多选最多展示的 pill 数；未传时将“自适应”计算
  showSelectedSummary?: boolean;// 多选是否用一颗“已选 X 项”的 primary Pill 汇总展示
  pillCloseable?: boolean;      // 多选单条 pill 是否可在 pill 内关闭，默认 true
  summaryText?: (n: number) => string; // 自定义汇总 pill 文案，默认：已选 n 项
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
    size = 'md',

    // 多选展示控制
    maxTagCount,
    showSelectedSummary,
    pillCloseable = true,
    summaryText,
  } = props;

  const multiple = (props as MultiProps).multiple === true;
  const controlledValue = (props as any).value as (string | string[] | undefined);
  const defaultValue = (props as any).defaultValue as (string | string[] | undefined);
  const onChange = (props as any).onChange as ((v: string | string[]) => void) | undefined;

  const id = useId();
  const isControlled = typeof controlledValue !== "undefined";
  const [internal, setInternal] = useState<string | string[] | undefined>(defaultValue);
  const val = (isControlled ? controlledValue : internal) as (string | string[] | undefined);

  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [mountNode, setMountNode] = useState<Element | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  // 键盘高亮索引
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // 选中集合与派生
  const selectedSet = useMemo(() => new Set(
    Array.isArray(val) ? val : (typeof val === 'string' && val ? [val] : [])
  ), [val]);
  const selectedOptions = useMemo(() => options.filter(o => selectedSet.has(o.value)), [options, selectedSet]);
  const selectedLabels = useMemo(() => selectedOptions.map(o => o.label), [selectedOptions]);

  const itemText = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const textTone = multiple
    ? ((selectedLabels.length > 0) ? 'text-gray-700' : 'text-gray-400')
    : ((typeof val === 'string' && val) ? 'text-gray-700' : 'text-gray-400');

  // 单选清空按钮：多选不在输入框里放清空（关闭在 pill 内）
  const canClearSingle = !!clearable && !multiple && !!val;

  const commitSingle = (v: string) => { if (!isControlled) setInternal(v); onChange?.(v); setOpen(false); };
  const toggleMulti = (v: string) => {
    const curr = Array.isArray(val) ? val : [];
    const next = curr.includes(v) ? curr.filter(x => x !== v) : [...curr, v];
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };
  const handleClearAll = () => {
    if (multiple) {
      if (!isControlled) setInternal([]);
      onChange?.([]);
    } else {
      if (!isControlled) setInternal("");
      onChange?.("");
    }
  };
  const handlePillClose = (value: string) => {
    const newSelected = (Array.isArray(val) ? val.filter(v => v !== value) : []);
    if (!isControlled) setInternal(newSelected);
    onChange?.(newSelected);
  };

  // 点击文档关闭
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!pop.current || !anchor.current) return;
      if (pop.current.contains(e.target as Node) || anchor.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Portal 容器
  useEffect(() => {
    if (typeof document !== 'undefined') setMountNode(document.getElementById('layout-body') || document.body);
  }, []);

  // 预定位，减少首次打开闪动
  useEffect(() => {
    const update = () => {
      const el = anchor.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const top = r.bottom + 4 + window.scrollY;
      const left = r.left + window.scrollX;
      setPos({ top, left, width: r.width });
    };
    update();
    const ro = 'ResizeObserver' in window ? new ResizeObserver(update) : null;
    if (ro && anchor.current) ro.observe(anchor.current);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, []);

  // 打开时设置 activeIndex 到第一个可用项 / 当前选中项
  useEffect(() => {
    if (!open) return;
    const start = multiple
      ? Math.max(0, options.findIndex(o => selectedSet.has(o.value)))
      : Math.max(0, options.findIndex(o => o.value === val));
    setActiveIndex(start === -1 ? 0 : start);
  }, [open, multiple, options, selectedSet, val]);

  // 保持高亮项可见
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const opt = document.getElementById(`${id}-opt-${activeIndex}`);
    opt?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, id]);

  // 键盘逻辑
  const moveActive = useCallback((delta: number) => {
    if (!open) setOpen(true);
    setActiveIndex(prev => {
      const len = options.length;
      if (len === 0) return -1;
      let i = prev;
      let safety = len;
      do {
        i = (i + delta + len) % len;
        safety--;
      } while (options[i].disabled && safety > 0);
      return i;
    });
  }, [open, options, setOpen]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      if (activeIndex >= 0 && activeIndex < options.length && !options[activeIndex].disabled) {
        const v = options[activeIndex].value;
        multiple ? toggleMulti(v) : commitSingle(v);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Backspace' && multiple) {
      if (Array.isArray(val) && val.length > 0) {
        handlePillClose(val[val.length - 1]);
      }
    }
  }, [activeIndex, commitSingle, handlePillClose, moveActive, multiple, open, options, toggleMulti, val]);

  const labelText = !multiple
    ? (typeof val === 'string' && val ? (options.find(o => o.value === val)?.label ?? '') : '')
    : '';

  // —— 多选：自适应 maxTagCount ——
  const n = selectedLabels.length;
  const _summaryText = useMemo(() => summaryText ?? ((k: number) => `已选${k} 项`), [summaryText]);

  const [autoCount, setAutoCount] = useState<number>(Infinity);
  const measureRef = useRef<HTMLDivElement>(null);

  // 计算可展示的 Pill 数量，保证单行不换行，多余用 +N
  useLayoutEffect(() => {
    if (!multiple) return;
    const btn = buttonRef.current;
    const meas = measureRef.current;
    if (!btn || !meas) return;

    const measure = () => {
      const btnEl = buttonRef.current;
      const measEl = measureRef.current;
      if (!btnEl || !measEl) return;

      const style = window.getComputedStyle(btnEl);
      const contentWidth = btnEl.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (!Number.isFinite(contentWidth) || contentWidth <= 0) {
        setAutoCount(0);
        return;
      }

      const children = Array.from(measEl.children) as HTMLElement[];
      const gapStyle = window.getComputedStyle(measEl);
      const gap = parseFloat(gapStyle.columnGap || gapStyle.gap || '0') || 0;

      let used = 0;
      let count = 0;

      for (const el of children) {
        const w = el.offsetWidth;
        const add = count > 0 ? gap : 0;
        if (used + add + w <= contentWidth) {
          used += add + w;
          count++;
        } else {
          break;
        }
      }

      if (count < n) {
        const rest = n - count;
        const approxPlus = 44 + Math.max(0, String(rest).length - 1) * 10;
        while (count > 0 && (used + gap + approxPlus) > contentWidth) {
          const lastEl = children[count - 1];
          const lastW = lastEl?.offsetWidth ?? 0;
          used -= (count > 1 ? gap : 0) + lastW;
          count--;
        }
      }

      setAutoCount(count);
    };

    let frame = requestAnimationFrame(measure);
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(schedule);
      resizeObserver.observe(btn);
    } else {
      window.addEventListener('resize', schedule);
    }

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      if (!resizeObserver) {
        window.removeEventListener('resize', schedule);
      }
    };
  }, [multiple, n, selectedOptions, size]);

  // 组装多选可视内容
  const renderMultiContent = () => {
    if (n === 0) return (placeholder || '');
    // 1) 强制汇总（primary）
    if (showSelectedSummary) {
      return (
        <Pill
          tone="primary"
          className="max-w-full"
          closeable={!!clearable}
          onClose={handleClearAll}
        >
          {_summaryText(n)}
        </Pill>
      );
    }
    // 2) 限制展示数量 + 剩余 primary 汇总（未传 maxTagCount 则用自适应 autoCount）
    const limit = typeof maxTagCount === 'number' && maxTagCount >= 0 ? maxTagCount : autoCount;
    const head = selectedOptions.slice(0, limit);
    const rest = n - head.length;

    return (
      <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-hidden">
        {head.map(o => (
          <Pill
            key={o.value}
            tone={'neutral'}
            className="max-w-full shrink-0"
            closeable={pillCloseable}
            onClose={() => handlePillClose(o.value)}
          >
            <span className="truncate">{o.label}</span>
          </Pill>
        ))}
        {rest > 0 && (
          <Pill tone="primary" className="max-w-full shrink-0">
            +{rest}
          </Pill>
        )}
      </div>
    );
  };

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}{required ? <span className="ml-0.5 text-error">*</span> : null}</span>}

      {/* 不可见测量区：用于计算每个 Pill 的真实宽度（含 gap） */}
      {multiple && (
        <div ref={measureRef} className="invisible fixed -z-50 top-0 left-0 flex flex-nowrap gap-2">
          {selectedOptions.map(o => (
            <Pill key={`m-${o.value}`} tone="neutral" className="max-w-full shrink-0" closeable={pillCloseable}>
              <span className="truncate">{o.label}</span>
            </Pill>
          ))}
        </div>
      )}

      <div ref={anchor} className={`relative ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          id={id}
          onClick={() => setOpen(o => !o)}
          onKeyDown={onKeyDown}
          onFocus={(e) => {
            if (e.currentTarget.matches(':focus-visible')) setOpen(true);
          }}
          className={[
            inputBase,
            inputSize[size],
            status ? inputStatus[status] : '',
            'text-left flex items-center',
            textTone,
            size === 'lg' ? 'pr-12' : size === 'sm' ? 'pr-8' : 'pr-10'
          ].filter(Boolean).join(' ')}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={status === 'error' ? true : undefined}
          aria-controls={`${id}-listbox`}
        >
          {!multiple ? (labelText || placeholder || '') : renderMultiContent()}
        </button>

        {/* 单选才显示右侧清空；多选关闭在 Pill 内 */}
        {canClearSingle && (
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

        {open && mountNode && createPortal(
          <div
            ref={pop}
            role="listbox"
            id={`${id}-listbox`}
            className="fixed z-[1200] max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-elevation-1"
            style={{ top: pos.top, left: pos.left, minWidth: pos.width } as CSSProperties}
            aria-multiselectable={multiple || undefined}
          >
            <div ref={listRef}>
              {options.map((o, i) => {
                const selected = selectedSet.has(o.value);
                const active = i === activeIndex;
                const optionId = `${id}-opt-${i}`;
                return (
                  <button
                    type="button"
                    id={optionId}
                    key={o.value}
                    role="option"
                    aria-disabled={o.disabled}
                    aria-selected={selected}
                    disabled={o.disabled}
                    className={[
                      'flex w-full items-center justify-between px-3 py-2',
                      itemText,
                      o.disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700',
                      active ? 'bg-gray-100' : (selected ? 'bg-gray-50' : 'hover:bg-gray-50'),
                    ].join(' ')}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => (multiple ? toggleMulti(o.value) : commitSingle(o.value))}
                  >
                    <span className="truncate">{o.label}</span>
                    {selected && <Check size={16} className="text-primary" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </div>,
          mountNode
        )}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
