'use client';

import type { HTMLAttributes } from 'react';

export type ProgressTone = 'primary' | 'info' | 'success' | 'warning' | 'danger';

type ProgressBarProps = {
  value: number;
  max?: number;
  tone?: ProgressTone;
  showValue?: boolean;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

const toneClasses: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-error',
};

export default function ProgressBar({
  value,
  max = 100,
  tone = 'primary',
  showValue = false,
  className = '',
  ...props
}: ProgressBarProps) {
  const safeMax = max <= 0 ? 100 : max;
  const ratio = Math.min(Math.max(value / safeMax, 0), 1);
  const percent = Math.round(ratio * 100);

  return (
    <div className={['flex items-center gap-2', className].filter(Boolean).join(' ')} {...props}>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={Math.round(ratio * safeMax)}>
        <div
          className={['absolute left-0 top-0 h-full rounded-full transition-[width] duration-300 ease-out', toneClasses[tone]].join(' ')}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showValue ? <span className="tabular-nums text-xs text-gray-500">{percent}%</span> : null}
    </div>
  );
}