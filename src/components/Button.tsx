'use client';

// Styles are handled via Tailwind CSS utility classes
import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'default' | 'warning' | 'success' | 'error' | 'info';
  outline?: boolean;
};

export default function Button({
  variant = 'primary',
  outline = false,
  className = '',
  ...props
}: Props) {
  const base =
    'inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-white hover:shadow-md active:shadow';
  const solid: Record<string, string> = {
    primary: 'border border-transparent bg-primary text-white focus-visible:ring-primary',
    default: 'border border-transparent bg-default text-white focus-visible:ring-default',
    warning: 'border border-transparent bg-warning text-white focus-visible:ring-warning',
    success: 'border border-transparent bg-success text-white focus-visible:ring-success',
    error: 'border border-transparent bg-error text-white focus-visible:ring-error',
    info: 'border border-transparent bg-info text-white focus-visible:ring-info',
  };
  const outlined: Record<string, string> = {
    primary: 'border border-primary text-primary bg-white focus-visible:ring-primary',
    default: 'border border-default text-default bg-white focus-visible:ring-default',
    warning: 'border border-warning text-warning bg-white focus-visible:ring-warning',
    success: 'border border-success text-success bg-white focus-visible:ring-success',
    error: 'border border-error text-error bg-white focus-visible:ring-error',
    info: 'border border-info text-info bg-white focus-visible:ring-info',
  };
  const variants = outline ? outlined : solid;
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
