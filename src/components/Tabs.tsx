'use client';

import React, { ReactNode, useState, useCallback } from 'react';

type TabItem = {
  key: string;
  label: ReactNode;
  content?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

type TabsProps = {
  items: TabItem[];
  className?: string;
  variant?: 'line' | 'card' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  keepMounted?: boolean;
  destroyInactive?: boolean;
  onChange?: (activeKey: string) => void;
};

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(' ');
}

export default function Tabs({
  items,
  className = '',
  variant = 'line',
  size = 'md',
  keepMounted = false,
  destroyInactive = true,
  onChange,
}: TabsProps) {
  const firstKey = items.find((i) => !i.disabled)?.key ?? items[0]?.key;
  const [active, setActive] = useState<string | undefined>(firstKey);

  /** 视觉尺寸 */
  const sizeCls =
    {
      sm: 'h-8 text-xs px-2.5',
      md: 'h-9 text-sm px-3',
      lg: 'h-10 text-base px-3.5',
    }[size] ?? 'h-9 text-sm px-3';

  const navBase =
    variant === 'line'
      ? 'border-b border-gray-200'
      : variant === 'card'
      ? 'border-b border-gray-200 bg-white'
      : 'bg-gray-100 rounded-md p-1';

  const itemCls = (isActive: boolean, disabled?: boolean) =>
    cx(
      'relative whitespace-nowrap truncate select-none',
      sizeCls,
      disabled && 'opacity-40 pointer-events-none',
      variant === 'line' &&
        (isActive
          ? 'text-primary border-b-2 border-primary'
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'),
      variant === 'card' &&
        (isActive
          ? 'text-primary bg-white border border-gray-200 rounded-t-md'
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-t-md'),
      variant === 'pill' &&
        (isActive ? 'text-white bg-primary rounded-md' : 'text-gray-800 hover:bg-gray-200 rounded-md'),
    );

  const onNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, it: TabItem) => {
      if (it.disabled) {
        e.preventDefault();
        return;
      }
      setActive(it.key);
      onChange?.(it.key); // Notify parent of change
    },
    [onChange],
  );

  const activeItem = items.find((i) => i.key === active);

  return (
    <div className={cx(
      className,
      "grid grid-rows-[auto_1fr]"
    )}>
      <div className={cx('flex items-end gap-2 overflow-x-auto no-scrollbar', navBase)}>
        {items.map((it) => {
          const isActive = it.key === active;
          return (
            <a
              key={it.key}
              href="#"
              onClick={(e) => onNavClick(e, it)}
              className={itemCls(isActive, it.disabled)}
            >
              {it.icon && <span className="mr-1">{it.icon}</span>}
              <span>{it.label}</span>
            </a>
          );
        })}
      </div>

      <div
        className={'bg-white p-4'}>
        {keepMounted
          ? items.map((it) => (
              <div key={it.key} hidden={it.key !== active}>
                {it.content}
              </div>
            ))
          : items
              .filter(
                (it) => it.key === activeItem?.key || (!destroyInactive && it.key !== activeItem?.key),
              )
              .map((it) => <div key={it.key}>{it.content}</div>)}
      </div>
    </div>
  );
}
