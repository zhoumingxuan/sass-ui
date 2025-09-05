'use client';

import { ChangeEvent } from 'react';
import { controlRing, controlDisabled, fieldLabel, helperText } from './formStyles';

export type RadioOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type RadioProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  description?: string;
};

export function Radio({ label, description, className = '', disabled, ...props }: RadioProps) {
  return (
    <label className={`inline-flex items-start gap-2 ${disabled ? controlDisabled : ''} ${className}`}>
      <input
        type="radio"
        disabled={disabled}
        className={[
          'mt-0.5 h-4 w-4 shrink-0 rounded-full border bg-white',
          'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
          'checked:border-primary/60 checked:hover:border-primary checked:hover:bg-primary/5',
          'accent-primary disabled:accent-gray-300',
          'disabled:hover:border-gray-200 disabled:hover:bg-white',
          controlRing,
          'transition-colors',
        ].join(' ')}
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

type RadioGroupProps = {
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options?: RadioOption[];
  label?: string;
  helper?: string;
  disabled?: boolean;
  className?: string;
  inline?: boolean;
};

export function RadioGroup({
  name,
  value,
  defaultValue,
  onChange,
  options,
  label,
  helper,
  disabled,
  className = '',
  inline = false,
}: RadioGroupProps) {
  const isControlled = typeof value !== 'undefined';
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={`${disabled ? controlDisabled : ''} ${className}`}>
      {label && <div className={fieldLabel}>{label}</div>}
      <div className={inline ? 'flex flex-wrap items-center gap-4' : 'space-y-2'}>
        {options?.map((opt) => (
          <Radio
            key={opt.value}
            name={name}
            value={opt.value}
            checked={isControlled ? value === opt.value : undefined}
            defaultChecked={!isControlled ? defaultValue === opt.value : undefined}
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
