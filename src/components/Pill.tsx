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
  neutral: 'bg-gray-100 text-gray-600',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
};

export default function Pill({ tone = 'neutral', icon, children, className = '' }: PillProps) {
  return (
    <span
      className={[
        'inline-flex select-none items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
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