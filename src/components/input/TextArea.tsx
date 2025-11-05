'use client';

import { TextareaHTMLAttributes, useMemo } from "react";
import { inputBase, fieldLabel, helperText, inputStatus, Status, InputSize, inputSize } from "../formStyles";
import type { WithFormFieldValue } from "../formTypes";

type Props = WithFormFieldValue<Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size">, string> & {
  status?: Status;
  size?: InputSize; // lg | md | sm
};

export default function TextArea({ value, defaultValue, status, className = '', onChange, size = 'md', ...props }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  const currentValue = useMemo(() => {
    const Default = typeof defaultValue !== 'undefined' ? defaultValue : undefined;
    const Value = typeof value !== 'undefined' ? value : undefined;
    return Value ? Value : Default
  }, [value, defaultValue])

  return (
    <textarea
      autoComplete="off"
      aria-invalid={status === 'error' ? true : undefined}
      className={[inputBase, inputSize[size], status ? inputStatus[status] : '', 'min-h-24 py-2 resize-y', className].filter(Boolean).join(' ')}
      value={currentValue}
      onChange={handleChange}
      {...props}
    />
  );
}
