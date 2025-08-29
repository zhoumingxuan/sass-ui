'use client';

// Styles are handled via Tailwind CSS utility classes
import { ButtonHTMLAttributes, ReactNode, isValidElement, cloneElement } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'default' | 'warning' | 'success' | 'error' | 'info';
  outline?: boolean; // deprecated; kept for backward compatibility
  appearance?: 'solid' | 'outline' | 'dashed' | 'link' | 'ghost';
  size?: 'large' | 'medium' | 'small';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  block?: boolean;
};

export default function Button({
  variant = 'primary',
  outline = false,
  appearance,
  size = 'medium',
  icon,
  iconPosition = 'left',
  block = false,
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
    primary: 'border border-transparent bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary',
    // default: white background with subtle border and dark text
    default: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-300',
    warning: 'border border-transparent bg-warning text-white hover:bg-warning/90 focus-visible:ring-warning',
    success: 'border border-transparent bg-success text-white hover:bg-success/90 focus-visible:ring-success',
    error: 'border border-transparent bg-error text-white hover:bg-error/90 focus-visible:ring-error',
    info: 'border border-transparent bg-info text-white hover:bg-info/90 focus-visible:ring-info',
  };
  const outlined: Record<string, string> = {
    primary: 'border border-primary text-primary bg-white focus-visible:ring-primary',
    default: 'border border-gray-300 text-gray-700 bg-white focus-visible:ring-gray-300',
    warning: 'border border-warning text-warning bg-white focus-visible:ring-warning',
    success: 'border border-success text-success bg-white focus-visible:ring-success',
    error: 'border border-error text-error bg-white focus-visible:ring-error',
    info: 'border border-info text-info bg-white focus-visible:ring-info',
  };
  const dashed: Record<string, string> = {
    primary: 'border border-dashed border-primary text-primary bg-white focus-visible:ring-primary',
    default: 'border border-dashed border-gray-300 text-gray-700 bg-white focus-visible:ring-gray-300',
    warning: 'border border-dashed border-warning text-warning bg-white focus-visible:ring-warning',
    success: 'border border-dashed border-success text-success bg-white focus-visible:ring-success',
    error: 'border border-dashed border-error text-error bg-white focus-visible:ring-error',
    info: 'border border-dashed border-info text-info bg-white focus-visible:ring-info',
  };
  const linkStyles: Record<string, string> = {
    primary: 'border border-transparent bg-transparent text-primary shadow-none hover:underline focus-visible:ring-primary',
    default: 'border border-transparent bg-transparent text-gray-700 shadow-none hover:underline focus-visible:ring-gray-300',
    warning: 'border border-transparent bg-transparent text-warning shadow-none hover:underline focus-visible:ring-warning',
    success: 'border border-transparent bg-transparent text-success shadow-none hover:underline focus-visible:ring-success',
    error: 'border border-transparent bg-transparent text-error shadow-none hover:underline focus-visible:ring-error',
    info: 'border border-transparent bg-transparent text-info shadow-none hover:underline focus-visible:ring-info',
  };
  const ghost: Record<string, string> = {
    primary: 'border border-transparent bg-transparent text-primary hover:bg-primary/10 focus-visible:ring-primary',
    default: 'border border-transparent bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-300',
    warning: 'border border-transparent bg-transparent text-warning hover:bg-warning/10 focus-visible:ring-warning',
    success: 'border border-transparent bg-transparent text-success hover:bg-success/10 focus-visible:ring-success',
    error: 'border border-transparent bg-transparent text-error hover:bg-error/10 focus-visible:ring-error',
    info: 'border border-transparent bg-transparent text-info hover:bg-info/10 focus-visible:ring-info',
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

  // determine appearance (solid/outline/dashed/link)
  const mode: 'solid' | 'outline' | 'dashed' | 'link' | 'ghost' = appearance
    ? appearance
    : outline
    ? 'outline'
    : 'solid';

  let modeClasses = '';
  if (mode === 'solid') modeClasses = solid[variant];
  else if (mode === 'outline') modeClasses = outlined[variant];
  else if (mode === 'dashed') modeClasses = dashed[variant];
  else if (mode === 'link') modeClasses = linkStyles[variant];
  else if (mode === 'ghost') modeClasses = ghost[variant];

  const linkSizes: Record<'large'|'medium'|'small', string> = { large: 'h-auto p-0 text-base', medium: 'h-auto p-0 text-sm', small: 'h-auto p-0 text-xs' };
  const finalSize = mode === 'link' ? linkSizes[size] : sizes[size];
  const widthClass = block ? 'w-full' : '';

  return (
    <button
      className={`${base} ${finalSize} ${modeClasses} ${withGap} ${widthClass} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'left' ? iconNode : null}
      {hasLabel ? props.children : null}
      {icon && iconPosition === 'right' ? iconNode : null}
    </button>
  );
}
