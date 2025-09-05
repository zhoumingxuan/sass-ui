"use client";

import { SelectHTMLAttributes, useId, useState } from "react";
import { inputBase, fieldLabel, helperText } from "../formStyles";
import { X } from "lucide-react";

export type Option = { value: string; label: string; disabled?: boolean };

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  label?: string;
  helper?: string;
  options: Option[];
  placeholder?: string;
  clearable?: boolean;
  onChange?: (value: string) => void;
};

export default function Select({ label, helper, options, placeholder, clearable, className = "", value, defaultValue, onChange, ...props }: Props) {
  const id = useId();
  const isControlled = typeof value !== "undefined";
  const [internal, setInternal] = useState<string | undefined>(defaultValue as any);
  const val = (isControlled ? value : internal) as any;

  const canClear = clearable && !!val;
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };
  const handleClear = () => {
    if (!isControlled) setInternal("");
    onChange?.("");
  };

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div className={`relative ${className}`}>
        <select id={id} className={`${inputBase} pr-10 appearance-none text-gray-700 ${canClear ? 'pr-16' : ''}`} value={val ?? ''} onChange={handleChange} {...props}>
          {placeholder && <option value="" disabled={props.required}>{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
          ))}
        </select>
        {canClear && (
          <button type="button" onClick={handleClear} aria-label="清空" className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} aria-hidden />
          </button>
        )}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
