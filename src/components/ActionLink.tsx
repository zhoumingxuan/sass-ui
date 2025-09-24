'use client';

import React from 'react';
import { controlRing } from './formStyles';

type Variant = 'link' | 'ghost' | 'soft';
type Tone = 'default' | 'primary' | 'danger' | 'muted';
type Size = 'xs' | 'sm';

type CommonProps = {
  variant?: Variant;
  tone?: Tone;
  size?: Size;
  /** 仅图标：禁用下划线，统一 28×28 点击热区 */
  iconOnly?: boolean;
  /** 下划线策略（iconOnly 会强制 never） */
  underline?: 'hover' | 'always' | 'never';
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
};

/** 原生属性：两边都允许；在分支里再分别转型 */
type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'color' | 'className'
>;
type NativeAnchorProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'color' | 'className'
>;

export type ActionLinkProps = CommonProps & NativeButtonProps & NativeAnchorProps;

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function toneClasses(tone: Tone, variant: Variant) {
  if (variant === 'ghost') {
    // ghost 主要通过背景表现语气，文字保持中性，悬停微加深
    return 'text-gray-600 hover:text-gray-900';
  }
  if (tone === 'primary') return 'text-primary hover:text-primary/80';
  if (tone === 'danger') return 'text-red-600 hover:text-red-700';
  if (tone === 'muted') return 'text-gray-500 hover:text-gray-700';
  return 'text-gray-600 hover:text-gray-900';
}

function basePadding(size: Size | undefined, iconOnly?: boolean) {
  if (iconOnly) return 'w-7 h-7 inline-flex items-center justify-center'; // 28px 热区
  if (size === 'xs') return 'px-1 py-0.5';
  return 'px-1.5 py-1';
}

function sizeClasses(size: Size | undefined) {
  if (size === 'xs') return 'text-[13px] leading-[1.1]';
  return 'text-sm leading-[1.2]';
}

function underlineClasses(underline: NonNullable<ActionLinkProps['underline']>) {
  if (underline === 'always') return 'underline underline-offset-4';
  if (underline === 'never') return 'no-underline';
  return 'underline-offset-4 hover:underline';
}

function variantClasses(variant: Variant, tone: Tone, iconOnly?: boolean) {
  if (variant === 'ghost') {
    // 轻背景 + 焦点环；不改变布局
    return cx(
      'rounded-sm',
      iconOnly ? '' : 'rounded-sm',
      tone === 'primary'
        ? 'hover:bg-primary/10 active:bg-primary/15 focus-visible:bg-primary/10'
        : 'hover:bg-gray-100 active:bg-gray-200 focus-visible:bg-gray-100'
    );
  }
  if (variant === 'soft') {
    // 比 link 更平滑的文本动作（无下划线，轻背景）
    return cx(
      'rounded-sm',
      tone === 'primary'
        ? 'text-primary hover:bg-primary/10 active:bg-primary/15'
        : 'hover:bg-gray-100 active:bg-gray-200'
    );
  }
  // link：纯文本（用下划线策略控制表现）
  return '';
}

export default function ActionLink(props: ActionLinkProps) {
  const {
    // —— 设计属性（有默认值） ——
    variant = 'link',
    tone: toneRaw = 'default',
    size = 'sm',
    iconOnly = false,
    underline: underlineRaw = 'hover',

    // —— 通用属性 ——
    className = '',
    disabled = false,
    children,

    // —— 区分 a / button 的关键属性 ——
    href,
    onClick,

    // 其余透传（会在分支里精确转型）
    ...rest
  } = props;

  const tone: Tone = toneRaw;
  const underline = iconOnly ? 'never' : (underlineRaw ?? 'hover');

  const rootCls = cx(
    'inline-flex items-center gap-1 select-none rounded-sm',
    basePadding(size, iconOnly),
    sizeClasses(size),
    toneClasses(tone, variant),
    underlineClasses(underline),
    variantClasses(variant, tone, iconOnly),
    controlRing,
    'focus-visible:ring-primary/40 focus-visible:outline-none',
    disabled && 'opacity-50 pointer-events-none cursor-default',
    className
  );

  const isLink = typeof href === 'string' && href.length > 0;

  if (isLink) {
    const aProps = rest as NativeAnchorProps;
    return (
      <a
        {...aProps}
        href={href}
        role="button"
        aria-disabled={disabled || undefined}
        className={rootCls}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          onClick?.(e);
        }}
      >
        {children}
      </a>
    );
  }

  const btnProps = rest as NativeButtonProps;
  return (
    <button
      {...btnProps}
      type={btnProps.type ?? 'button'}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={rootCls}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
