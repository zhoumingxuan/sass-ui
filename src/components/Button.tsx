'use client';

// Styles are handled via Tailwind CSS utility classes
import { ButtonHTMLAttributes, ReactNode, isValidElement, cloneElement } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'default' | 'warning' | 'success' | 'error' | 'info';
  outline?: boolean;
  size?: 'large' | 'medium' | 'small';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
};

export default function Button({
  variant = 'primary',
  outline = false,
  size = 'medium',
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}: Props) {
  const base =
    'inline-flex items-center justify-center rounded-lg font-medium shadow-sm transition-shadow transition-transform duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-950 hover:shadow active:shadow-sm hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:hover:shadow-none disabled:active:shadow-none disabled:translate-y-0 disabled:hover:translate-y-0 disabled:active:translate-y-0 disabled:cursor-not-allowed disabled:pointer-events-none disabled:focus-visible:ring-0 disabled:focus-visible:ring-offset-0';
  const sizes: Record<string, string> = {
    large: 'h-11 px-6 text-base',
    medium: 'h-9 px-4 text-sm',
    small: 'h-7 px-3 text-xs',
  };
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

  const hasLabel = !!props.children;
  const withGap = icon && hasLabel ? 'gap-2' : '';
  const iconSizeMap: Record<'large' | 'medium' | 'small', number> = {
    large: 20,
    medium: 16,
    small: 14,
  };
  let iconNode: ReactNode = icon;
  if (icon && isValidElement(icon)) {
    const anyProps: any = (icon as any).props ?? {};
    const mergedClass = [anyProps.className, 'shrink-0'].filter(Boolean).join(' ');
    iconNode = cloneElement(icon as any, {
      className: mergedClass,
      size: anyProps.size ?? iconSizeMap[size],
      strokeWidth: anyProps.strokeWidth ?? 2,
      'aria-hidden': anyProps['aria-hidden'] ?? true,
    });
  }

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${withGap} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'left' ? iconNode : null}
      {hasLabel ? props.children : null}
      {icon && iconPosition === 'right' ? iconNode : null}
    </button>
  );
}
