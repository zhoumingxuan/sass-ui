"use client";

import { InputHTMLAttributes, ReactNode, useId, useMemo } from "react";
import {
  inputBase,
  inputStatus,
  Status,
  InputSize,
  inputSize,
  inputPR
} from "../formStyles";
import type { WithFormFieldValue } from "../formTypes";

type Props = WithFormFieldValue<Omit<InputHTMLAttributes<HTMLInputElement>, "size">, string> & {
  prefix?: ReactNode;
  suffix?: ReactNode;
  status?: Status;
  size?: InputSize;
};

export default function Text({
  prefix,
  suffix,
  value,
  defaultValue,
  status,
  className = "",
  onChange,
  size = "md",
  ...props
}: Props) {
  const id = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const currentValue = useMemo(() => {
    const Default = typeof defaultValue !== 'undefined' ? defaultValue : undefined;
    const Value = typeof value !== 'undefined' ? value : undefined;
    return Value?Value:Default
  },[value,defaultValue])

  const sizeSuffixPadding = suffix ? inputPR[size] : "";
  const prefixPadding =
    prefix && size === "sm"
      ? "pl-6"
      : prefix && size === "lg"
      ? "pl-9"
      : prefix
      ? "pl-8"
      : "";

  return (
    <div className={`relative flex items-center ${className}`}>
      {prefix && (
        <span
          className={`pointer-events-none absolute left-3 text-gray-400 ${
            size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"
          }`}
        >
          {prefix}
        </span>
      )}
      <input
        id={id}
        type="text"
        autoComplete="off"
        aria-invalid={status === "error" ? true : undefined}
        className={[
          inputBase,
          inputSize[size],
          status ? inputStatus[status] : "",
          prefixPadding,
          sizeSuffixPadding
        ]
          .filter(Boolean)
          .join(" ")}
        value={currentValue}
        onChange={handleChange}
        {...props}
      />
      {suffix && (
        <span
          className={`pointer-events-none absolute ${
            size === "lg" ? "right-3" : size === "sm" ? "right-1" : "right-2"
          } text-gray-400 ${
            size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"
          }`}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
