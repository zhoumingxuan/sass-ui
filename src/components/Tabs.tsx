'use client';

import { ReactNode, useState } from 'react';

type TabItem = {
  key: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
};

type TabsProps = {
  items: TabItem[];
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  className?: string;
};

export default function Tabs({ items, defaultActiveKey, onChange, className = '' }: TabsProps) {
  const firstKey = defaultActiveKey ?? items.find((i) => !i.disabled)?.key ?? items[0]?.key;
  const [activeKey, setActiveKey] = useState<string | undefined>(firstKey);

  const active = items.find((i) => i.key === activeKey);

  const handleClick = (key: string, disabled?: boolean) => {
    if (disabled) return;
    setActiveKey(key);
    onChange?.(key);
  };

  return (
    <div className={className}>
      <div className="flex gap-2 border-b border-gray-200">
        {items.map((it) => {
          const isActive = it.key === activeKey;
          return (
            <button
              key={it.key}
              onClick={() => handleClick(it.key, it.disabled)}
              className={[
                'relative -mb-px px-3 h-9 rounded-t-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
                'transition-colors select-none',
                it.disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isActive
                  ? 'text-primary border-b-2 border-primary bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
              ].join(' ')}
            >
              {it.label}
            </button>
          );
        })}
      </div>
      <div className="p-4 bg-white border border-t-0 border-gray-200 rounded-b-md rounded-tr-md">
        {active?.content}
      </div>
    </div>
  );
}
