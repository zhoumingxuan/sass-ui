'use client';

import { useId } from 'react';
import { fieldLabel, helperText, controlDisabled } from './formStyles';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helper?: string;
  showValue?: boolean;
};

export default function Slider({ label, helper, className = '', showValue = true, disabled, ...props }: Props) {
  const id = useId();
  const { value, defaultValue, min = 0, max = 100 } = props as any;
  const val = typeof value !== 'undefined' ? Number(value) : typeof defaultValue !== 'undefined' ? Number(defaultValue) : undefined;
  const pct = typeof val === 'number' ? ((val - Number(min)) / (Number(max) - Number(min))) * 100 : 0;

  return (
    <label className={`block ${disabled ? controlDisabled : ''}`} htmlFor={id}>
      {label && <span className={fieldLabel}>{label}</span>}
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          disabled={disabled}
          className={[
            'w-full appearance-none h-2 rounded-full outline-none',
            // Remove overall focus ring/border per UX, keep clean track
            'focus:outline-none',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary',
            '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary',
            className,
          ].join(' ')}
          style={{
            background: `linear-gradient(#1e80ff, #1e80ff) 0/ ${pct}% 100% no-repeat, #e5e7eb`,
          }}
          {...props}
        />
        {showValue && typeof val !== 'undefined' && (
          <span className="w-10 text-right text-xs text-gray-500">{val}</span>
        )}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
