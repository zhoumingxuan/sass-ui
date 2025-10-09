"use client";

import { InputHTMLAttributes, useId, useState } from "react";
import { inputBase, fieldLabel, helperText, InputSize, inputSize } from "../formStyles";

type DateProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "defaultValue" | "size"> & {
  label?: string;
  helper?: string;
  value?: string; // yyyy-mm-dd
  defaultValue?: string;
  min?: string;
  max?: string;
  disabledDate?: (date: string) => boolean; // block certain days
  onChange?: (value: string) => void;
  size?: InputSize;
};

export default function DateInput({ label, helper, className = "", value, defaultValue, min, max, disabledDate, onChange, size = 'md', ...props }: DateProps) {
  const id = useId();
  const isControlled = typeof value !== "undefined";
  const [internal, setInternal] = useState<string | undefined>(defaultValue);
  const val: string | undefined = isControlled ? value : internal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (disabledDate && v && disabledDate(v)) return; // ignore invalid
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <input id={id} type="date" className={`${inputBase} ${inputSize[size]} text-gray-700 ${className}`} value={val || ''} onChange={handleChange} min={min} max={max} {...props} />
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}

type RangeProps = {
  label?: string;
  helper?: string;
  start?: string;
  end?: string;
  defaultStart?: string;
  defaultEnd?: string;
  min?: string;
  max?: string;
  onChange?: (start?: string, end?: string) => void;
  size?: InputSize;
};

export function DateRange({ label, helper, start, end, defaultStart, defaultEnd, min, max, onChange, size = 'md' }: RangeProps) {
  const isControlled = typeof start !== "undefined" || typeof end !== "undefined";
  const [s, setS] = useState<string | undefined>(defaultStart);
  const [e, setE] = useState<string | undefined>(defaultEnd);
  const sv = isControlled ? start : s;
  const ev = isControlled ? end : e;

  const setStart = (v?: string) => { if (!isControlled) setS(v); onChange?.(v, ev); };
  const setEnd = (v?: string) => { if (!isControlled) setE(v); onChange?.(sv, v); };

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div className="inline-flex items-center gap-2">
        <input type="date" className={`${inputBase} ${inputSize[size]} w-date-input text-gray-700`} value={sv || ''} min={min} max={ev ?? max} onChange={(e) => setStart(e.target.value || undefined)} />
        <span className="px-2 text-xs text-gray-500">至</span>
        <input type="date" className={`${inputBase} ${inputSize[size]} w-date-input text-gray-700`} value={ev || ''} min={sv ?? min} max={max} onChange={(e) => setEnd(e.target.value || undefined)} />
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
