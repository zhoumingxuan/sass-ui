'use client';

import type { ReactNode } from 'react';

export type PillTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

type PillProps = {
  tone?: PillTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

const toneClasses: Record<PillTone, string> = {
  neutral: 'border border-gray-200 bg-gray-100 text-gray-700',
  primary: 'border border-primary/20 bg-primary/10 text-primary',
  success: 'border border-success/20 bg-success/10 text-success',
  warning: 'border border-warning/20 bg-warning/10 text-warning',
  danger: 'border border-error/20 bg-error/10 text-error',
  info: 'border border-info/20 bg-info/10 text-info',
};

export default function Pill({ tone = 'neutral', icon, children, className = '' }: PillProps) {
  return (
    <span
      className={[
        'inline-flex select-none items-center gap-1 rounded-full px-3 py-1 text-xs font-medium leading-none shadow-[0_1px_0_rgba(15,23,42,0.04)]',
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon ? <span className="inline-flex h-3.5 w-3.5 items-center justify-center">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}