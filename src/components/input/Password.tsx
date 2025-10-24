"use client";

import { InputHTMLAttributes, useMemo, useState } from "react";
import { inputBase, inputStatus, Status, InputSize, inputSize } from "../formStyles";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  status?: Status;
  value?: string;
  defaultValue?:string;
  size?: InputSize; // lg | md | sm
};

export default function Password({ status, 
  className = "", 
  size = 'md',
  value,
  defaultValue,
  onChange,
  ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const icon_size=size === 'lg' ? 20 : size === 'sm' ? 16 : 18;


  const currentValue = useMemo(() => {
    const Default = typeof defaultValue !== 'undefined' ? defaultValue : undefined;
    const Value = typeof value !== 'undefined' ? value : undefined;
    return Value?Value:Default
  },[value,defaultValue])

  return (
    <div className={`relative ${className}`}>
      <input
        type={visible ? "text" : "password"}
        aria-invalid={status === 'error' ? true : undefined}
        className={[inputBase, inputSize[size], status ? inputStatus[status] : '', 'pr-2'].filter(Boolean).join(" ")}
        onChange={e=>{          
          onChange?.(e.target.value);
        }}
        value={currentValue}
        {...props}
      />
      <a
        role="button"
        href="#"
        onClick={e=>{
          e.preventDefault();
          e.stopPropagation();
          setVisible(v => !v)
        }}
        aria-label={visible ? "隐藏密码" : "显示密码"}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        {visible ? <EyeOff size={icon_size} aria-hidden /> : <Eye  size={icon_size} aria-hidden />}
      </a>
    </div>
  );
}
