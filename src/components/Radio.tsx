'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
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
    <label className={`inline-flex items-center gap-2 ${disabled ? controlDisabled : ''} ${className}`}>
      <input
        type="radio"
        disabled={disabled}
        className={[
          'mt-0 h-3.5 w-3.5 shrink-0 rounded-full border bg-white',
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
  disabled,
  className = '',
  inline = false,
}: RadioGroupProps) {

  const [selected,setSelected]=useState(typeof defaultValue !== 'undefined' ? defaultValue : []);
  
  useEffect(()=>{
    setSelected(typeof value !== 'undefined' ? value : []);
  },[value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelected(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <div className={[inline ? 'flex flex-wrap items-center gap-4' : 'space-y-2',className].join(" ")}>
      {options?.map((opt) => (
        <Radio
          key={opt.value}
          name={name}
          value={opt.value}
          checked={selected === opt.value}
          onChange={handleChange}
          disabled={disabled || opt.disabled}
          label={opt.label}
          description={opt.description}
        />
      ))}
    </div>
  );
}
