'use client';

import type { ButtonHTMLAttributes } from 'react';
import { controlRing } from './formStyles';

type ActionLinkProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  emphasized?: boolean;
};

export default function ActionLink({ emphasized = false, className = '', ...props }: ActionLinkProps) {
  return (
    <button
      type={props.type ?? 'button'}
      className={[
        'inline-flex items-center gap-1 text-sm font-medium',
        emphasized ? 'text-primary hover:text-primary/80' : 'text-gray-600 hover:text-gray-900',
        'underline-offset-4 hover:underline focus-visible:underline',
        controlRing,
        'rounded-md px-1 py-0.5 focus-visible:ring-primary/40',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}