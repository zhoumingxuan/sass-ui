'use client';

import { ReactNode } from 'react';

export type StepStatus = 'pending' | 'active' | 'done' | 'error' | 'disabled';

export type StepItem = {
  key: string | number;
  title: ReactNode;
  description?: ReactNode;
  status?: StepStatus;
  meta?: ReactNode; // right side small text / pill
};

type StepsProps = {
  items: StepItem[];
  orientation?: 'vertical' | 'horizontal';
  activeKey?: StepItem['key'];
  onChange?: (key: StepItem['key']) => void;
  size?: 'sm' | 'md';
  className?: string;
  /**
   * Display index offset for numbering.
   * Used to make numbering continuous across grouped Steps.
   */
  startIndex?: number;
};

const toneByStatus: Record<StepStatus, string> = {
  pending: 'text-gray-500 border-gray-300 bg-white',
  active: 'text-primary border-primary bg-primary/10',
  done: 'text-white border-success bg-success',
  error: 'text-white border-error bg-error',
  disabled: 'text-gray-400 border-gray-200 bg-gray-100',
};

const lineByStatus: Record<Exclude<StepStatus, 'disabled'>, string> = {
  pending: 'bg-gray-200',
  active: 'bg-primary/60',
  done: 'bg-success/60',
  error: 'bg-error/60',
};

export default function Steps({
  items,
  orientation = 'vertical',
  activeKey,
  onChange,
  size = 'md',
  className = '',
  startIndex = 0,
}: StepsProps) {
  const isVertical = orientation === 'vertical';
  const dotSize = size === 'sm' ? 'h-6 w-6 text-xs' : 'h-7 w-7 text-sm';
  const gap = size === 'sm' ? 'gap-2' : 'gap-2.5';
  const padding = size === 'sm' ? 'py-2' : 'py-2.5';

  return (
    <div className={[isVertical ? 'flex flex-col' : 'flex items-center', className].join(' ')}>
      {items.map((item, idx) => {
        const status: StepStatus = item.status ?? (item.key === activeKey ? 'active' : 'pending');
        const isActiveRow = item.key === activeKey;
        // 为了避免与外层卡片/分组边框产生冲突，选中仅使用轻量底色，不再额外描边
        const clickable = typeof onChange === 'function' && status !== 'disabled';
        const isLast = idx === items.length - 1;
        return (
          <div
            key={item.key}
            className={[
              isVertical ? 'flex' : 'inline-flex items-center',
              gap,
              padding,
              // 轻量行态效果：更现代的交互反馈；整行可点击
              'rounded-md -mx-1 px-1',
              clickable ? 'group transition-colors cursor-pointer' : '',
              isActiveRow ? 'bg-primary/5' : 'hover:bg-gray-50/70',
            ].join(' ')}
            aria-selected={isActiveRow ? true : undefined}
            onClick={(e) => {
              if (!clickable) return;
              const el = e.target as HTMLElement;
              if (el.closest('button')) return; // 避免与按钮自身点击重复
              onChange?.(item.key);
            }}
          >
            <div className="relative flex flex-col items-center">
              <button
                type="button"
                aria-current={item.key === activeKey ? 'step' : undefined}
                disabled={status === 'disabled'}
                onClick={() => clickable && onChange && onChange(item.key)}
                className={[
                  'shrink-0 rounded-full border font-medium inline-flex items-center justify-center select-none',
                  dotSize,
                  toneByStatus[status],
                  clickable ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {status === 'done' ? (
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M5 10l3 3 7-7" />
                  </svg>
                ) : status === 'error' ? (
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M6 6l8 8M14 6l-8 8" />
                  </svg>
                ) : (
                  <span className="leading-none">{startIndex + idx + 1}</span>
                )}
              </button>
              {isVertical && !isLast ? (
                <div
                  className={[
                    'w-px flex-1 mt-1',
                    status === 'disabled' ? 'bg-gray-200' : lineByStatus[(status as Exclude<StepStatus, 'disabled'>)] ?? 'bg-gray-200',
                  ].join(' ')}
                />
              ) : null}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={[
                    'font-medium whitespace-nowrap leading-5',
                    status === 'disabled' ? 'text-gray-400' : 'text-gray-800',
                    isActiveRow ? 'text-gray-900 font-semibold' : '',
                  ].join(' ')}
                >
                  {item.title}
                </div>
                {item.meta && <div className="ml-auto text-xs text-gray-500 shrink-0">{item.meta}</div>}
              </div>
              {item.description ? (
                <div className={['text-xs mt-0.5 leading-5 whitespace-nowrap', isActiveRow ? 'text-gray-600' : 'text-gray-500'].join(' ')}>{item.description}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
