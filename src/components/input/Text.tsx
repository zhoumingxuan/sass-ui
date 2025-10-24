"use client";

import { InputHTMLAttributes, ReactNode, useId, useState } from "react";
import {
  inputBase,
  inputStatus,
  Status,
  InputSize,
  inputSize,
  inputPR
} from "../formStyles";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  prefix?: ReactNode;
  suffix?: ReactNode;
  status?: Status;
  size?: InputSize;
};

export default function Text({
  prefix,
  suffix,
  status,
  className = "",
  onChange,
  size = "md",
  ...props
}: Props) {
  const id = useId();
  const isControlled = Object.prototype.hasOwnProperty.call(props, "value");
  const [internal, setInternal] = useState<string>(() =>
    (props.defaultValue as string | number | readonly string[] | undefined)?.toString() ?? ""
  );
  const rawVal = isControlled ? props.value : internal;
  const val: string =
    (rawVal as string | number | readonly string[] | undefined)?.toString() ?? "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternal(e.target.value);
    onChange?.(e);
  };

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
        value={val}
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
