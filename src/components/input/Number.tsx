"use client";

import { InputHTMLAttributes, useEffect, useId, useState } from "react";
import { inputBase, fieldLabel, helperText, inputStatus, Status } from "../formStyles";
import { ChevronUp, ChevronDown } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "defaultValue"> & {
  label?: string;
  helper?: string;
  value?: number;
  defaultValue?: number;
  step?: number;
  min?: number;
  max?: number;
  precision?: number; // decimal places
  onChange?: (value: number | null) => void;
  status?: Status;
};

export default function Number({ label, helper, className = "", value, defaultValue, step = 1, min, max, precision, onChange, status, ...props }: Props) {
  const id = useId();
  const isControlled = typeof value === "number" || value === null;
  const [internal, setInternal] = useState<number | null>(typeof defaultValue === "number" ? defaultValue : null);
  const val = isControlled ? value : internal;
  const [text, setText] = useState<string>(val !== null && typeof val === 'number' ? String(val) : "");
  useEffect(() => {
    setText(val === null || typeof val === 'undefined' ? "" : String(val));
  }, [val]);

  const fmt = (v: number) => (typeof precision === "number" ? Number(v.toFixed(precision)) : v);
  const clamp = (v: number) => {
    let n = v;
    if (typeof min === "number") n = Math.max(min, n);
    if (typeof max === "number") n = Math.min(max, n);
    return fmt(n);
  };

  const commit = (n: number | null) => {
    if (!isControlled) setInternal(n);
    onChange?.(n);
  };

  const inc = () => {
    const base = typeof val === "number" ? val : typeof min === "number" ? min : 0;
    commit(clamp(base + (step || 1)));
  };
  const dec = () => {
    const base = typeof val === "number" ? val : typeof min === "number" ? min : 0;
    commit(clamp(base - (step || 1)));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    if (raw.trim() === "") { commit(null); return; }
    // allow intermediate states like '-' or '1.' without committing invalid number
    const maybe = Number(raw);
    if (Number.isFinite(maybe)) {
      // do not clamp while typing; clamp on blur/controls
      if (!isControlled) setInternal(maybe);
      onChange?.(maybe);
    }
  };

  const handleBlur = () => {
    if (text.trim() === "") { commit(null); return; }
    const maybe = Number(text);
    if (Number.isFinite(maybe)) {
      const c = clamp(maybe);
      setText(String(c));
      commit(c);
    } else {
      // restore last valid
      setText(val !== null && typeof val === 'number' ? String(val) : "");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); inc(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); dec(); }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (document.activeElement !== e.currentTarget) return;
    e.preventDefault();
    if (e.deltaY < 0) inc(); else if (e.deltaY > 0) dec();
  };

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div className={`relative flex items-center ${className}`}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          aria-invalid={status === 'error' ? true : undefined}
          className={[inputBase, status ? inputStatus[status] : '', "pr-10"].filter(Boolean).join(" ")}
          value={text}
          onChange={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          {...props}
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <button type="button" aria-label="增加" className="h-5 w-7 rounded-md text-gray-600 hover:bg-gray-100 flex items-center justify-center" onClick={inc}>
            <ChevronUp size={14} />
          </button>
          <button type="button" aria-label="减少" className="mt-0.5 h-5 w-7 rounded-md text-gray-600 hover:bg-gray-100 flex items-center justify-center" onClick={dec}>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
