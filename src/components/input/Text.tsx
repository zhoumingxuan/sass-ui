"use client";

import { InputHTMLAttributes, ReactNode, useId, useState } from "react";
import { inputBase, fieldLabel, helperText, inputStatus, Status, InputSize, inputSize, inputPR } from "../formStyles";
import { X } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string;
  helper?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  clearable?: boolean;
  status?: Status;
  size?: InputSize; // lg | md | sm
};

export default function Text({ label, helper, prefix, suffix, clearable = false, status, className = "", onChange, size = 'md', ...props }: Props) {
  const id = useId();
  const isControlled = Object.prototype.hasOwnProperty.call(props, "value");
  const [internal, setInternal] = useState<string>(() => (props.defaultValue as string | number | readonly string[] | undefined)?.toString() ?? "");
  const rawVal = isControlled ? props.value : internal;
  const val: string = (rawVal as string | number | readonly string[] | undefined)?.toString() ?? '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternal(e.target.value);
    onChange?.(e);
  };
  const handleClear = () => {
    const e = { target: { value: "" } } as unknown as React.ChangeEvent<HTMLInputElement>;
    if (!isControlled) setInternal("");
    onChange?.(e);
  };

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div className={`relative flex items-center ${className}`}>
        {prefix && <span className={`pointer-events-none absolute left-3 text-gray-400 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>{prefix}</span>}
        <input
          id={id}
          type="text"
          aria-invalid={status === 'error' ? true : undefined}
          className={[
            inputBase,
            inputSize[size],
            status ? inputStatus[status] : '',
            prefix ? "pl-8" : "",
            suffix || clearable ? (size === 'lg' ? 'pr-12' : size === 'sm' ? 'pr-8' : 'pr-10') : '',
          ].filter(Boolean).join(" ")}
          value={val}
          onChange={handleChange}
          {...props}
        />
        {clearable && val && (
          <button type="button" onClick={handleClear} aria-label="清空" className={`absolute ${size === 'lg' ? 'right-12' : size === 'sm' ? 'right-8' : 'right-10'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600`}>
            <X size={16} aria-hidden />
          </button>
        )}
        {suffix && <span className={`pointer-events-none absolute right-3 text-gray-400 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>{suffix}</span>}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
