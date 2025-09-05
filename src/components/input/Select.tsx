"use client";

import { useEffect, useId, useRef, useState } from "react";
import { inputBase, fieldLabel, helperText } from "../formStyles";
import { X, Check, ChevronDown } from "lucide-react";

export type Option = { value: string; label: string; disabled?: boolean };

type Props = {
  label?: string;
  helper?: string;
  options: Option[];
  placeholder?: string;
  clearable?: boolean;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  className?: string;
};

export default function Select({ label, helper, options, placeholder, clearable, className = "", value, defaultValue, onChange, required }: Props) {
  const id = useId();
  const isControlled = typeof value !== "undefined";
  const [internal, setInternal] = useState<string | undefined>(defaultValue);
  const val = (isControlled ? value : internal) as string | undefined;
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);

  const canClear = clearable && !!val;
  const commit = (v: string) => { if (!isControlled) setInternal(v); onChange?.(v); setOpen(false); };
  const handleClear = () => { if (!isControlled) setInternal(""); onChange?.(""); };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!pop.current || !anchor.current) return;
      if (pop.current.contains(e.target as Node) || anchor.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const labelText = val ? options.find(o => o.value === val)?.label ?? '' : '';

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div ref={anchor} className={`relative ${className}`}>
        <button type="button" id={id} onClick={() => setOpen(o => !o)} className={`${inputBase} text-left pr-10 h-10 flex items-center`}>{labelText || placeholder || ''}</button>
        {canClear && (
          <button type="button" onClick={handleClear} aria-label="清空" className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} aria-hidden />
          </button>
        )}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><ChevronDown size={16} aria-hidden /></span>
        {open && (
          <div ref={pop} role="listbox" className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-elevation-1">
            {(placeholder && !required) && (
              <button type="button" role="option" aria-selected={!val} className="flex w-full items-center justify-between px-3 py-2 text-sm text-gray-500 hover:bg-gray-50" onClick={() => commit("")}> 
                {placeholder}
              </button>
            )}
            {options.map(o => (
              <button
                type="button"
                key={o.value}
                role="option"
                aria-disabled={o.disabled}
                aria-selected={val === o.value}
                disabled={o.disabled}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 ${o.disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'}`}
                onClick={() => commit(o.value)}
              >
                <span>{o.label}</span>
                {val === o.value && <Check size={16} className="text-primary" aria-hidden />}
              </button>
            ))}
          </div>
        )}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
