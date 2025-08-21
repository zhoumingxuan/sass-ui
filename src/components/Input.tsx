'use client';

import { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

const base = 'p-2 border border-gray-300 rounded w-full';

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" className={`${base} ${className}`} {...props} />;
}

export function NumberInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" className={`${base} ${className}`} {...props} />;
}

export function PasswordInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="password" className={`${base} ${className}`} {...props} />;
}

export function SelectInput({ options, className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <select className={`${base} ${className}`} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function DateInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="date" className={`${base} ${className}`} {...props} />;
}

export function DateRangeInput({
  startProps = {},
  endProps = {},
}: {
  startProps?: InputHTMLAttributes<HTMLInputElement>;
  endProps?: InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div className="flex items-center gap-2">
      <input type="date" className={base} {...startProps} />
      <span>至</span>
      <input type="date" className={base} {...endProps} />
    </div>
  );
}
