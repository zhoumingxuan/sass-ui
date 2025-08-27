'use client';

import { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

const base =
  'w-full h-10 rounded-lg border border-gray-200 px-3 text-sm placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-none';

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string };

export function TextInput({ label, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-xs text-gray-500">{label}</span>}
      <input type="text" className={`${base} ${className}`} {...props} />
    </label>
  );
}

export function NumberInput({ label, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-xs text-gray-500">{label}</span>}
      <input type="number" className={`${base} ${className}`} {...props} />
    </label>
  );
}

export function PasswordInput({ label, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-xs text-gray-500">{label}</span>}
      <input type="password" className={`${base} ${className}`} {...props} />
    </label>
  );
}

export function SelectInput({
  options,
  label,
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
  label?: string;
}) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-xs text-gray-500">{label}</span>}
      <div className="relative">
        <select
          className={`${base} pr-10 appearance-none text-gray-500 ${className}`}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">⌄</span>
      </div>
    </label>
  );
}

export function DateInput({ label, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-xs text-gray-500">{label}</span>}
      <input
        type="date"
        className={`${base} text-gray-500 ${className}`}
        {...props}
      />
    </label>
  );
}

export function DateRangeInput({
  startProps = {},
  endProps = {},
  label,
}: {
  startProps?: InputHTMLAttributes<HTMLInputElement>;
  endProps?: InputHTMLAttributes<HTMLInputElement>;
  label?: string;
}) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-xs text-gray-500">{label}</span>}
      <div className="inline-flex items-center gap-2">
        <input
          type="date"
          className={`${base} w-[180px] text-gray-500`}
          {...startProps}
        />
        <span className="px-2 text-xs text-gray-500">至</span>
        <input
          type="date"
          className={`${base} w-[180px] text-gray-500`}
          {...endProps}
        />
      </div>
    </label>
  );
}
