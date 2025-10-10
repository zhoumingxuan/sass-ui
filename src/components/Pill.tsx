'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';

export type PillTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: PillTone;
  icon?: ReactNode;
  children: ReactNode;
  closeable?: boolean;
  onClose?: () => void;
};

const toneClasses: Record<PillTone, string> = {
  neutral: 'border border-gray-200 bg-gray-100 text-gray-700',
  primary: 'border border-primary/20 bg-primary/10 text-primary',
  success: 'border border-success/20 bg-success/10 text-success',
  warning: 'border border-warning/20 bg-warning/10 text-warning',
  danger:  'border border-error/20 bg-error/10 text-error',
  info:    'border border-info/20 bg-info/10 text-info',
};

const toneCloseClasses: Record<PillTone, string> = {
  neutral: 'text-gray-500 hover:text-gray-700',
  primary: 'text-primary hover:text-primary/80',
  success: 'text-success hover:text-success/80',
  warning: 'text-warning hover:text-warning/80',
  danger:  'text-error hover:text-error/80',
  info:    'text-info hover:text-info/80',
};

const Pill = forwardRef<HTMLSpanElement, PillProps>(function Pill(
  {
    tone = 'neutral',
    icon,
    children,
    className = '',
    closeable = false,
    onClose,
    ...rest
  },
  ref,
) {
  return (
    <span
      ref={ref}
      {...rest}
      className={[
        'inline-flex select-none items-center gap-1 rounded-full px-2 py-1 text-xs font-medium leading-none whitespace-nowrap min-w-0',
        toneClasses[tone],
        className,
      ].filter(Boolean).join(' ')}
    >
      {icon ? <span className="inline-flex h-3.5 w-3.5 items-center justify-center">{icon}</span> : null}
      <span className="truncate">{children}</span>
      {closeable && onClose && (
        <a
          href="#"
          role="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose?.();
          }}
          aria-label="关闭"
          className={[
            'ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full p-0.5 leading-none focus:outline-none no-underline',
            toneCloseClasses[tone],
          ].join(' ')}
        >
          <X size={12} className="pointer-events-none" />
        </a>
      )}
    </span>
  );
});

export default Pill;
