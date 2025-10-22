'use client';

import { ChangeEvent, useCallback, useEffect, useId, useMemo, useState } from 'react';
import { fieldLabel, helperText, controlDisabled, controlRing } from './formStyles';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helper?: string;
  showValue?: boolean;
};

const toNumber = (input: unknown): number | undefined => {
  if (typeof input === 'number') return input;
  if (typeof input === 'string' && input.trim() !== '') {
    const parsed = Number(input);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export default function Slider({ label, helper, className = '', showValue = true, disabled, ...props }: Props) {
  const id = useId();
  const { value, defaultValue, onChange, min = 0, max = 100, ...rest } = props;

  const controlled = typeof value !== 'undefined';
  const numericMin = Number(min);
  const numericMax = Number(max);

  const defaultNumeric = controlled ? undefined : toNumber(defaultValue);
  const [internal, setInternal] = useState<number | undefined>(defaultNumeric);

  useEffect(() => {
    if (!controlled) setInternal(defaultNumeric);
  }, [controlled, defaultNumeric]);

  const current = controlled ? toNumber(value) : internal;

  const percentage = useMemo(() => {
    if (typeof current !== 'number') return 0;
    const span = numericMax - numericMin;
    if (span === 0) return 0;
    return ((current - numericMin) / span) * 100;
  }, [current, numericMax, numericMin]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = toNumber(event.target.value);
      if (!controlled && typeof next !== 'undefined') setInternal(next);
      onChange?.(event);
    },
    [controlled, onChange]
  );

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
            // �?currentColor 作为填充色基准，配合 Tailwind 语义色避免常�?            'text-primary',
            // Remove overall focus ring/border per UX, keep clean track
            controlRing,
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary',
            '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary',
            className,
          ].join(' ')}
          style={{
            // 左侧进度使用 currentColor，右侧轨道使�?Tailwind 的灰色变量，避免硬编码颜�?            background: `linear-gradient(currentColor, currentColor) 0/ ${percentage}% 100% no-repeat, var(--color-gray-200)`,
          }}
          value={controlled ? current : undefined}
          defaultValue={!controlled ? defaultNumeric : undefined}
          onChange={handleChange}
          {...rest}
        />
        {showValue && typeof current !== 'undefined' && (
          <span className="w-10 text-right text-xs text-gray-500">{current}</span>
        )}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
