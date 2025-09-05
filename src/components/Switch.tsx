'use client';

import { useId, useState } from 'react';
import { controlRing, controlDisabled, fieldLabel, helperText } from './formStyles';

type Size = 'small' | 'medium' | 'large';

type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  value?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: Size;
  className?: string;
};

export default function Switch({
  checked,
  defaultChecked,
  onChange,
  name,
  value = 'on',
  disabled,
  label,
  description,
  size = 'medium',
  className = '',
}: SwitchProps) {
  const id = useId();
  const [internal, setInternal] = useState<boolean>(!!defaultChecked);
  const isControlled = typeof checked === 'boolean';
  const isOn = isControlled ? !!checked : internal;

  const sizes: Record<Size, { track: string; thumb: string }>
    = {
      small: { track: 'h-5 w-9', thumb: isOn ? 'translate-x-4' : 'translate-x-0' },
      medium:{ track: 'h-6 w-11', thumb: isOn ? 'translate-x-5' : 'translate-x-0' },
      large: { track: 'h-7 w-14', thumb: isOn ? 'translate-x-7' : 'translate-x-0' },
    };

  const trackOn = 'bg-primary';
  const trackOff = 'bg-gray-200';
  const thumbBase = 'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition';

  const handleToggle = () => {
    if (disabled) return;
    const next = !isOn;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  return (
    <div className={`select-none ${disabled ? controlDisabled : ''} ${className}`}>
      {label && <label htmlFor={id} className={fieldLabel}>{label}</label>}
      <div className="flex items-center gap-3">
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-disabled={disabled}
          onClick={handleToggle}
          className={[
            'relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors',
            isOn ? trackOn : trackOff,
            sizes[size].track,
            controlRing,
            disabled ? 'pointer-events-none' : '',
          ].join(' ')}
        >
          <span className="sr-only">toggle</span>
          <span
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${thumbBase} ${sizes[size].thumb}`}
            style={{ left: '2px' }}
          />
        </button>
        {description && (
          <span className="text-sm text-gray-600">{description}</span>
        )}
      </div>
      {name && (
        <input type="hidden" name={name} value={isOn ? value : ''} />
      )}
      {/* helper text slot */}
    </div>
  );
}

