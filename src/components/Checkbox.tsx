'use client';

import { ChangeEvent, useEffect, useRef } from 'react';
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
  // 三态：indeterminate 表示部分选中（父级半选）
  indeterminate?: boolean;
};

export function Checkbox({ label, description, indeterminate, className = '', disabled, ...props }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !!indeterminate && !props.checked;
    }
  }, [indeterminate, props.checked]);
  return (
    <label className={`inline-flex items-start gap-2 ${disabled ? controlDisabled : ''} ${className}`}>
      <input
        type="checkbox"
        disabled={disabled}
        ref={ref}
        aria-checked={indeterminate ? 'mixed' : undefined}
        className={[
          'mt-0.5 h-4 w-4 shrink-0 rounded border bg-white',
          // base hover feedback & disabled neutralization
          'border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:hover:border-gray-200 disabled:hover:bg-white',
          // checked hover refinement (keep subtle tint, stronger border)
          !indeterminate || props.checked ? 'accent-primary disabled:accent-gray-300 checked:border-primary/60 checked:hover:border-primary checked:hover:bg-primary/5' : '',
          // custom indeterminate visuals: tint background + centered dash (+ hover refinement)
          indeterminate && !props.checked
            ? [
                'relative appearance-none border-primary/60 bg-primary/10 hover:bg-primary/15 hover:border-primary',
                'after:content-[""] after:absolute after:left-1/2 after:top-1/2 after:h-0.5 after:w-2.5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded after:bg-primary hover:after:bg-primary',
                'disabled:after:bg-gray-400',
              ].join(' ')
            : '',
          controlRing,
          'transition-colors',
        ].filter(Boolean).join(' ')}
        {...props}
      />
      <span className="select-none">
        <span className="block text-sm text-gray-700">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-gray-500">{description}</span>
        )}
      </span>
    </label>
  );
}

type CheckboxGroupProps = {
  name?: string;
  values?: string[]; // legacy
  defaultValues?: string[]; // legacy
  value?: string[]; // form-friendly alias
  defaultValue?: string[]; // form-friendly alias
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
  value,
  defaultValue,
  onChange,
  options,
  label,
  helper,
  disabled,
  className = '',
  inline = false,
}: CheckboxGroupProps) {
  const nextValues = typeof value !== 'undefined' ? value : values;
  const nextDefault = typeof defaultValue !== 'undefined' ? defaultValue : defaultValues;
  const isControlled = Array.isArray(nextValues);
  const current = isControlled ? (nextValues as string[]) : nextDefault ?? [];

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
