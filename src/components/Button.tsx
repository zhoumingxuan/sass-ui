'use client';

// Styles are handled via Tailwind CSS utility classes
import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
};

export default function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base = 'px-4 py-2 rounded text-white text-sm';
  const variants: Record<string, string> = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    danger: 'bg-danger',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
