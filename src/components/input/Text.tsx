"use client";

import { InputHTMLAttributes, ReactNode, useId, useState } from "react";
import { inputBase, fieldLabel, helperText, inputStatus, Status } from "../formStyles";
import { X } from "lucide-react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helper?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  clearable?: boolean;
  status?: Status;
};

export default function Text({ label, helper, prefix, suffix, clearable = false, status, className = "", onChange, ...props }: Props) {
  const id = useId();
  const isControlled = Object.prototype.hasOwnProperty.call(props, "value");
  const [internal, setInternal] = useState("");
  const val = (isControlled ? (props.value as any) : internal) as any;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternal(e.target.value);
    onChange?.(e);
  };
  const handleClear = () => {
    const e = { target: { value: "" } } as any;
    if (!isControlled) setInternal("");
    // fire synthetic onChange for parent
    onChange?.(e);
  };

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div className={`relative flex items-center ${className}`}>
        {prefix && <span className="pointer-events-none absolute left-3 text-gray-400 text-sm">{prefix}</span>}
        <input
          id={id}
          type="text"
          aria-invalid={status === 'error' ? true : undefined}
          className={[inputBase, status ? inputStatus[status] : '', prefix ? "pl-8" : "", suffix || clearable ? "pr-8" : ""].filter(Boolean).join(" ")}
          value={(val as any) ?? ''}
          onChange={handleChange}
          {...props}
        />
        {clearable && val && (
          <button type="button" onClick={handleClear} aria-label="清空" className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} aria-hidden />
          </button>
        )}
        {suffix && <span className="pointer-events-none absolute right-3 text-gray-400 text-sm">{suffix}</span>}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
