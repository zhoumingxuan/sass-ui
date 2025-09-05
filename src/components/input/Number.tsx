"use client";

import { InputHTMLAttributes, useId, useMemo, useState } from "react";
import { inputBase, fieldLabel, helperText } from "../formStyles";

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
};

export default function Number({ label, helper, className = "", value, defaultValue, step = 1, min, max, precision, onChange, ...props }: Props) {
  const id = useId();
  const isControlled = typeof value === "number" || value === null;
  const [internal, setInternal] = useState<number | null>(typeof defaultValue === "number" ? defaultValue : null);
  const val = isControlled ? value : internal;

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
    const raw = e.target.value.trim();
    if (raw === "") return commit(null);
    const n = Number(raw);
    if (Number.isFinite(n)) commit(clamp(n));
  };

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div className={`relative flex items-center ${className}`}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          className={[inputBase, "pr-16"].join(" ")}
          value={val ?? ""}
          onChange={handleInput}
          {...props}
        />
        <div className="absolute right-1.5 flex items-center gap-1">
          <button type="button" className="h-7 px-2 rounded-md text-xs text-gray-600 hover:bg-gray-100" onClick={dec}>-</button>
          <button type="button" className="h-7 px-2 rounded-md text-xs text-gray-600 hover:bg-gray-100" onClick={inc}>+</button>
        </div>
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
