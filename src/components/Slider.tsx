'use client';

import { ChangeEvent, InputHTMLAttributes, useEffect, useId, useMemo, useState } from 'react';
import { fieldLabel, helperText, controlDisabled, controlRing } from './formStyles';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  showValue?: boolean;
  onChange?: (value:any) => void;
};

export default function Slider({
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

  const [current,setCurrent]=useState(typeof defaultValue !== 'undefined' ? Number(defaultValue):undefined);

  useEffect(() => {
    if (typeof value !== 'undefined') {
      setCurrent(Number(value));
    }
  }, [value]);


  const percent = useMemo(() => {
    const numericMin = Number(min);
    const numericMax = Number(max);
    const span = numericMax - numericMin;
    if (typeof current !== 'number' || span === 0) return 0;
    const ratio = (current - numericMin) / span;
    return Math.min(100, Math.max(0, ratio * 100));
  }, [current, max, min]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrent(Number(event.target.value));
    onChange?.(event.target.value);
  };

  return (
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
        value={current}
        onChange={handleChange}
        {...rest}
      />
      {showValue && typeof current === 'number' && (
        <span className="w-10 text-right text-xs text-gray-500">{current}</span>
      )}
    </div>
  );
}
