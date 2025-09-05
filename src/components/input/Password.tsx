"use client";

import { InputHTMLAttributes, useState } from "react";
import { inputBase, fieldLabel, helperText } from "../formStyles";
import { Eye, EyeOff } from "lucide-react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helper?: string;
};

export default function Password({ label, helper, className = "", ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div className={`relative ${className}`}>
        <input
          type={visible ? "text" : "password"}
          className={[inputBase, "pr-10"].join(" ")}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? "隐藏密码" : "显示密码"}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
