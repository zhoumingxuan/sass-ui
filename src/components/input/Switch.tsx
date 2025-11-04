'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { controlRing, controlDisabled, fieldLabel } from '../formStyles';

type Size = 'small' | 'medium' | 'large';

type SwitchProps = {
  // legacy props
  checked?: boolean;
  defaultChecked?: boolean;
  // form-friendly props
  value?: boolean;
  defaultValue?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  disabled?: boolean;
  size?: Size;
  className?: string;
};

export default function Switch({
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  size = 'medium',
  className = '',
}: SwitchProps) {
  const id = useId();
  const [checked,setChecked]=useState(defaultValue);

  useEffect(() => {
    if (typeof value !== 'undefined') {
      setChecked(value);
    }
  }, [value]);

  const isOn = checked;


  const sizes: Record<Size, { track: string; thumbSize: string; thumbTranslate: string }>
    = {
      small:  { track: 'h-5 w-9',  thumbSize: 'h-4 w-4', thumbTranslate: isOn ? 'translate-x-4' : 'translate-x-0' },
      medium: { track: 'h-6 w-11', thumbSize: 'h-5 w-5', thumbTranslate: isOn ? 'translate-x-5' : 'translate-x-0' },
      large:  { track: 'h-7 w-14', thumbSize: 'h-6 w-6', thumbTranslate: isOn ? 'translate-x-7' : 'translate-x-0' },
    };

  // Strong primary when ON; subtle neutral when OFF
  const trackOn = 'bg-primary border border-primary/50 shadow-inner';
  const trackOff = 'bg-gray-200 border border-gray-300 shadow-inner';
  const thumbBase = 'inline-block transform rounded-full bg-white shadow-md ring-0 transition will-change-transform border border-black/5';

  const handleToggle = () => {
    if (disabled) return;
    const next = !isOn;
    setChecked(next);
    onChange?.(next);
  };

  return (
    <div className={`select-none ${disabled ? controlDisabled : ''} ${className}`}>
      <div className="flex items-center gap-3">
        <a
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
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${thumbBase} ${sizes[size].thumbSize} ${sizes[size].thumbTranslate}`}
            style={{ left: '2px' }}
          />
        </a>
      </div>
      {name && (
        <input type="hidden" name={name} value={isOn ? 'on' : ''} />
      )}
      {/* helper text slot */}
    </div>
  );
}
