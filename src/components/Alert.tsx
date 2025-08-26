'use client';

import { ReactNode } from 'react';

// Alert 组件用于展示全局提示信息
export default function Alert({
  variant = 'info',
  className = '',
  children,
}: {
  variant?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
  children: ReactNode;
}) {
  const base = 'p-4 rounded-lg border shadow-sm';
  const variants: Record<string, string> = {
    success: 'bg-success text-white border-success',
    warning: 'bg-warning text-white border-warning',
    error: 'bg-error text-white border-error',
    info: 'bg-info text-white border-info',
  };
  return (
    <div role="alert" className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}

