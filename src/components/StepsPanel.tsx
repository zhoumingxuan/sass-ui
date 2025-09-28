'use client';

import type { ReactNode } from 'react';
import Steps, { StepItem } from './Steps';

export type StepGroup = {
  key: string;
  title: ReactNode;
  items: StepItem[];
};

type Props = {
  groups: StepGroup[];
  activeKey?: StepItem['key'];
  onChange?: (key: StepItem['key']) => void;
  className?: string;
  baseIndex?: number;
};

// 仅做分组与标题样式包装，保持与业务逻辑解耦
export default function StepsPanel({ groups, activeKey, onChange, className = '', baseIndex = 0 }: Props) {
  return (
    <div
      className={[
        // 卡片化外观，与右侧 Card 视觉统一
        'rounded-xl bg-white shadow-sm border border-gray-200 py-4 px-6 space-y-4',
        className,
      ].join(' ')}
    >
      {groups.map((g, i) => {
        const startIndex = baseIndex + groups.slice(0, i).reduce((sum, gg) => sum + (gg.items?.length || 0), 0);
        const isActive = g.items?.some((it) => it.key === activeKey);
        const activeIndex = g.items?.findIndex((it) => it.key === activeKey) ?? -1;
        const isActiveLast = activeIndex >= 0 && activeIndex === (g.items?.length || 0) - 1;
        return (
          <section
            key={g.key}
            className={[
              'rounded-lg border p-3 transition-colors overflow-hidden',
              isActiveLast ? 'pb-0' : '',
              'bg-white',
              isActive ? 'border-primary/30 bg-primary/5' : 'border-gray-100 hover:bg-gray-50/60',
            ].join(' ')}
          >
            <div className="mb-2 text-gray-800 font-medium text-sm px-1 flex items-center gap-2">
              <span className={['inline-block h-1.5 w-1.5 rounded-full', isActive ? 'bg-primary' : 'bg-gray-300'].join(' ')} />
              <span className="truncate">{g.title}</span>
            </div>
            <Steps items={g.items} activeKey={activeKey} onChange={onChange} startIndex={startIndex} />
          </section>
        );
      })}
    </div>
  );
}
