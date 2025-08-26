'use client';

// Styles are handled via Tailwind CSS utility classes
import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'default' | 'warning' | 'success' | 'error' | 'info';
};

export default function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 hover:shadow-md focus:shadow-md';
  const variants: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary',
    default: 'bg-default text-black hover:bg-default/90 focus:ring-default',
    warning: 'bg-warning text-white hover:bg-warning/90 focus:ring-warning',
    success: 'bg-success text-white hover:bg-success/90 focus:ring-success',
    error: 'bg-error text-white hover:bg-error/90 focus:ring-error',
    info: 'bg-info text-white hover:bg-info/90 focus:ring-info',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
