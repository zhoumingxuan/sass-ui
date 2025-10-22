'use client';

import { ChangeEvent, InputHTMLAttributes, useEffect, useId, useMemo, useState } from 'react';
import { fieldLabel, helperText, controlDisabled, controlRing } from './formStyles';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  label?: string;
  helper?: string;
  showValue?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

export default function Slider({
  label,
  helper,
  className = '',
  showValue = true,
  disabled,
  value,
  defaultValue,
  onChange,
  min = 0,
  max = 100,
  ...rest
}: Props) {
  const id = useId();
  const isControlled = typeof value !== 'undefined';
  const numericValue = isControlled ? Number(value) : undefined;
  const numericDefault = !isControlled && typeof defaultValue !== 'undefined' ? Number(defaultValue) : undefined;
  const [internal, setInternal] = useState<number | undefined>(numericValue ?? numericDefault);

  useEffect(() => {
    if (isControlled) {
      setInternal(numericValue);
    }
  }, [isControlled, numericValue]);

  const numericMin = Number(min);
  const numericMax = Number(max);
  const current = isControlled ? numericValue : internal;
  const span = numericMax - numericMin;
  const percent = useMemo(() => {
    if (typeof current !== 'number' || span === 0) return 0;
    const ratio = (current - numericMin) / span;
    return Math.min(100, Math.max(0, ratio * 100));
  }, [current, span, numericMin]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (!isControlled) setInternal(next);
    onChange?.(event);
  };

  return (
    <label className={`block ${disabled ? controlDisabled : ''}`} htmlFor={id}>
      {label && <span className={fieldLabel}>{label}</span>}
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          disabled={disabled}
          min={min}
          max={max}
          className={[
            'w-full appearance-none h-2 rounded-full outline-none',
            'text-primary',
            controlRing,
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary',
            '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary',
            className,
          ].join(' ')}
          style={{
            background: `linear-gradient(currentColor, currentColor) 0 / ${percent}% 100% no-repeat, var(--color-gray-200)`,
          }}
          value={isControlled ? numericValue : undefined}
          defaultValue={!isControlled ? numericDefault : undefined}
          onChange={handleChange}
          {...rest}
        />
        {showValue && typeof current === 'number' && (
          <span className="w-10 text-right text-xs text-gray-500">{current}</span>
        )}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
