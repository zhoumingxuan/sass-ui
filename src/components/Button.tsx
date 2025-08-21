'use client';

// Styles are handled via Tailwind CSS utility classes
import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'default' | 'warning' | 'success' | 'error' | 'info';
};

export default function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base = 'px-4 py-2 rounded text-sm';
  const variants: Record<string, string> = {
    primary: 'bg-primary text-white',
    default: 'bg-default text-black',
    warning: 'bg-warning text-white',
    success: 'bg-success text-white',
    error: 'bg-error text-white',
    info: 'bg-info text-white',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
