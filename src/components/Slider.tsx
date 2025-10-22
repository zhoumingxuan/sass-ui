'use client';

import { ChangeEvent, useEffect, useId, useState } from 'react';
import { fieldLabel, helperText, controlDisabled, controlRing } from './formStyles';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helper?: string;
  showValue?: boolean;
};

export default function Slider({ label, helper, className = '', showValue = true, disabled, ...props }: Props) {
  const id = useId();
  const { value, defaultValue, onChange, min = 0, max = 100, ...rest } = props;
  const isControlled = typeof value !== 'undefined';
  const parsedValue = isControlled ? Number(value) : undefined;
  const parsedDefault = !isControlled && typeof defaultValue !== 'undefined' ? Number(defaultValue) : undefined;
  const [internal, setInternal] = useState<number | undefined>(parsedDefault);

  useEffect(() => {
    if (!isControlled) {
      setInternal(parsedDefault);
    }
  }, [isControlled, parsedDefault]);

  const current = isControlled ? parsedValue : internal;
  const denom = Number(max) - Number(min);
  const pct = typeof current === 'number' && denom !== 0
    ? ((current - Number(min)) / denom) * 100
    : 0;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternal(Number(event.target.value));
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
            // 用 currentColor 作为填充色基准，配合 Tailwind 语义色避免常量
            'text-primary',
            // Remove overall focus ring/border per UX, keep clean track
          controlRing,
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary',
          '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary',
          className,
        ].join(' ')}
          style={{
            // 左侧进度使用 currentColor，右侧轨道使用 Tailwind 的灰色变量，避免硬编码颜色
            background: `linear-gradient(currentColor, currentColor) 0/ ${pct}% 100% no-repeat, var(--color-gray-200)`,
          }}
          value={isControlled ? parsedValue : undefined}
          defaultValue={!isControlled ? parsedDefault : undefined}
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
