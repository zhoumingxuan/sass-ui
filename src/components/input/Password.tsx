"use client";

import { InputHTMLAttributes, useState } from "react";
import { inputBase, fieldLabel, helperText, inputStatus, Status, InputSize, inputSize } from "../formStyles";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string;
  helper?: string;
  status?: Status;
  size?: InputSize; // lg | md | sm
};

export default function Password({ label, helper, status, className = "", size = 'md', ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div className={`relative ${className}`}>
        <input
          type={visible ? "text" : "password"}
          aria-invalid={status === 'error' ? true : undefined}
          className={[inputBase, inputSize[size], status ? inputStatus[status] : '', (size === 'lg' ? 'pr-12' : size === 'sm' ? 'pr-8' : 'pr-10')].filter(Boolean).join(" ")}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? "隐藏密码" : "显示密码"}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {visible ? <EyeOff size={size === 'lg' ? 20 : size === 'sm' ? 16 : 18} aria-hidden /> : <Eye size={size === 'lg' ? 20 : size === 'sm' ? 16 : 18} aria-hidden />}
        </button>
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
