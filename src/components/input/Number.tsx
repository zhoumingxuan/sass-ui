"use client";

import { InputHTMLAttributes, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { inputBase, inputStatus, Status, InputSize, inputSize } from "../formStyles";
import { ChevronUp, ChevronDown } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "defaultValue" | "size"> & {
  value?: number;
  defaultValue?: number;
  step?: number;
  min?: number;
  max?: number;
  precision?: number; // decimal places
  onChange?: (value: number | null) => void;
  status?: Status;
  size?: InputSize; // lg | md | sm
  formatter?: (value: number) => string;
  parser?: (text: string) => number | null;
  group?: boolean; // thousands grouping display when blurred
};

export default function NumberInput({ className = "", value, defaultValue, step = 1, min, max, precision, onChange, status, size = 'md', disabled, formatter, parser, group = false, ...props }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const val = useMemo(() => {
    const Default = typeof defaultValue !== 'undefined' ? defaultValue : undefined;
    const Value = typeof value !== 'undefined' ? value : undefined;
    return Value ? Value : Default
  }, [value, defaultValue])


  const applyPrecision = useCallback(
    (n: number) => (typeof precision === "number" ? Number(n.toFixed(precision)) : n),
    [precision]
  );

  const groupFormat = useCallback((n: number) => {
    const s = String(n);
    const [i, d] = s.split('.');
    const g = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return d ? `${g}.${d}` : g;
  }, []);

  const formatForDisplay = useCallback((n: number) => {
    const rounded = applyPrecision(n);
    if (formatter) return formatter(rounded);
    if (group) return groupFormat(rounded);
    return String(rounded);
  }, [applyPrecision, formatter, group, groupFormat]);

  const formatForInput = useCallback((n: number) => String(applyPrecision(n)), [applyPrecision]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (val === null || typeof val === 'undefined') {
      input.value = "";
      return;
    }
    const active = document.activeElement === input;
    input.value = active ? formatForInput(val) : formatForDisplay(val);
  }, [formatForDisplay, formatForInput, val]);

  const fmt = (v: number) => applyPrecision(v);
  const clamp = (v: number) => {
    let n = v;
    if (typeof min === "number") n = Math.max(min, n);
    if (typeof max === "number") n = Math.min(max, n);
    return fmt(n);
  };

  const commit = (n: number | null) => {
    onChange?.(n);
  };

  const decimalPlaces = (num: number) => {
    if (!Number.isFinite(num)) return 0;
    const s = String(num);
    if (s.includes('e-')) {
      const [, e] = s.split('e-');
      const d = (s.split('.')[1]?.length || 0) + Number(e);
      return d;
    }
    return s.split('.')[1]?.length || 0;
  };
  const scale = Math.pow(10, Math.max(decimalPlaces(step || 1), typeof precision === 'number' ? precision : 0));
  const preciseAdd = (n: number, dir: 1 | -1) => Math.round(n * scale + dir * (step || 1) * scale) / scale;

  const inc = () => {
    if (disabled) return;
    const base = typeof val === "number" ? val : typeof min === "number" ? min : 0;
    commit(clamp(preciseAdd(base, 1)));
  };
  const dec = () => {
    if (disabled) return;
    const base = typeof val === "number" ? val : typeof min === "number" ? min : 0;
    commit(clamp(preciseAdd(base, -1)));
  };

  const sanitize = (raw: string) => {
    let s = raw.replace(/[^0-9,.-]/g, '');
    const neg = s.startsWith('-');
    s = s.replace(/-/g, '');
    if (neg) s = '-' + s;
    const firstDot = s.indexOf('.');
    if (firstDot !== -1) s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
    return s;
  };

  const parse = (raw: string): number | null => {
    if (parser) return parser(raw);
    const s = raw.replace(/,/g, '');
    if (s.trim() === '' || s === '-' || s === '.' || s === '-.') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const s = sanitize(raw);
    if (s !== raw) {
      e.target.value = s;
    }
    if (s.trim() === "") { commit(null); return; }
    const maybe = parse(s);
    if (typeof maybe === 'number') {
      commit(maybe);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (val !== null && typeof val === 'number') {
      e.currentTarget.value = formatForInput(val);
    } else {
      e.currentTarget.value = "";
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const current = e.currentTarget.value;
    if (current.trim() === "") { e.currentTarget.value = ""; commit(null); return; }
    const maybe = parse(current);
    if (typeof maybe === 'number') {
      const c = clamp(maybe);
      e.currentTarget.value = formatForDisplay(c);
      commit(c);
    } else {
      const fallback = val !== null && typeof val === 'number' ? formatForDisplay(val) : "";
      e.currentTarget.value = fallback;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowUp') { e.preventDefault(); inc(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); dec(); }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (document.activeElement !== e.currentTarget) return;
    e.preventDefault();
    if (e.deltaY < 0) inc(); else if (e.deltaY > 0) dec();
  };

  const s = step || 1;
  const canInc = !disabled && (typeof max !== 'number' || (typeof val === 'number' ? val + s <= max : true));
  const canDec = !disabled && (typeof min !== 'number' || (typeof val === 'number' ? val - s >= min : true));

  const initialValue = val !== null && typeof val === "number" ? formatForDisplay(val) : "";

  return (
      <div
        className={`relative group flex items-center ${className}`}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          aria-invalid={status === 'error' ? true : undefined}
          className={[
            inputBase,
            inputSize[size],
            status ? inputStatus[status] : '',
            size === 'lg' ? 'pr-7' : size === 'sm' ? 'pr-5' : 'pr-6'
          ].filter(Boolean).join(" ")}
          defaultValue={initialValue}
          onChange={handleInput}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          disabled={disabled}
          {...props}
        />
        <div className={`absolute right-0 border-l-1 border-gray-200 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 group-hover:pointer-events-auto group-focus-within:pointer-events-auto ${disabled ? '!opacity-0 !pointer-events-none' : ''}`}>
          <div
            role="button"
            tabIndex={-1}
            aria-label="增加"
            onClick={() => { if (canInc) inc(); }}
            onKeyDown={(e) => { if (!canInc) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inc(); } }}
            className={`${size === 'lg' ? 'h-6 w-6' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} flex items-center  border-b-1 border-gray-200 justify-center select-none ${canInc ? 'text-gray-500 hover:text-gray-700 active:text-gray-800 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
          >
            <ChevronUp size={size === 'lg' ? 16 : size === 'sm' ? 12 : 14} aria-hidden />
          </div>
          <div
            role="button"
            tabIndex={-1}
            aria-label="减少"
            onClick={() => { if (canDec) dec(); }}
            onKeyDown={(e) => { if (!canDec) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dec(); } }}
            className={`mt-0.5 ${size === 'lg' ? 'h-6 w-6' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} flex items-center justify-center select-none ${canDec ? 'text-gray-500 hover:text-gray-700 active:text-gray-800 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
          >
            <ChevronDown size={size === 'lg' ? 16 : size === 'sm' ? 12 : 14} aria-hidden />
          </div>
        </div>
      </div>
  );
}
