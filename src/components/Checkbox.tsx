'use client';

import { ChangeEvent } from 'react';
import { controlRing, controlDisabled, fieldLabel, helperText } from './formStyles';

export type CheckboxOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  description?: string;
};

export function Checkbox({ label, description, className = '', disabled, ...props }: CheckboxProps) {
  return (
    <label className={`inline-flex items-start gap-2 ${disabled ? controlDisabled : ''} ${className}`}>
      <input
        type="checkbox"
        disabled={disabled}
        className={[
          'mt-0.5 h-4 w-4 shrink-0 rounded border border-gray-300 text-primary accent-primary',
          controlRing,
        ].join(' ')}
        {...props}
      />
      <span className="select-none">
        <span className="block text-sm text-gray-800">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-gray-500">{description}</span>
        )}
      </span>
    </label>
  );
}

type CheckboxGroupProps = {
  name?: string;
  values?: string[];
  defaultValues?: string[];
  onChange?: (values: string[]) => void;
  options?: CheckboxOption[];
  label?: string;
  helper?: string;
  disabled?: boolean;
  className?: string;
  inline?: boolean;
};

export function CheckboxGroup({
  name,
  values,
  defaultValues,
  onChange,
  options,
  label,
  helper,
  disabled,
  className = '',
  inline = false,
}: CheckboxGroupProps) {
  const isControlled = Array.isArray(values);
  const current = isControlled ? values! : defaultValues ?? [];

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const next = e.target.checked
      ? Array.from(new Set([...current, val]))
      : current.filter((v) => v !== val);
    onChange?.(next);
  };

  return (
    <div className={`${disabled ? controlDisabled : ''} ${className}`}>
      {label && <div className={fieldLabel}>{label}</div>}
      <div className={inline ? 'flex flex-wrap items-center gap-4' : 'space-y-2'}>
        {options?.map((opt) => (
          <Checkbox
            key={opt.value}
            name={name}
            value={opt.value}
            checked={isControlled ? current.includes(opt.value) : undefined}
            defaultChecked={!isControlled ? current.includes(opt.value) : undefined}
            onChange={handleChange}
            disabled={disabled || opt.disabled}
            label={opt.label}
            description={opt.description}
          />
        ))}
      </div>
      {helper && <div className={helperText}>{helper}</div>}
    </div>
  );
}
