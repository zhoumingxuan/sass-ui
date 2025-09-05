'use client';

import { ReactNode, useState } from 'react';

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
  const [open, setOpen] = useState(true);
  if (!open) return null;
  const base = 'relative flex items-start p-4 rounded-lg';
  const variants: Record<string, string> = {
    success: 'bg-success/10 border-l-4 border-success text-success/90',
    warning: 'bg-warning/10 border-l-4 border-warning text-warning/90',
    error: 'bg-error/10 border-l-4 border-error text-error/90',
    info: 'bg-info/10 border-l-4 border-info text-info/90',
  };
  return (
    <div role="alert" className={`${base} ${variants[variant]} ${className}`}>
      <div className="flex-1">{children}</div>
      <button
        onClick={() => setOpen(false)}
        className="ml-4 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
        aria-label="关闭"
      >
        ×
      </button>
    </div>
  );
}

