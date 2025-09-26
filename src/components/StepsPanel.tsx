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
};

// 仅做分组与标题样式包装，保持与业务逻辑解耦
export default function StepsPanel({ groups, activeKey, onChange, className = '' }: Props) {
  return (
    <div className={[
      'rounded-xl bg-white/80 shadow-sm border border-gray-200 p-3 space-y-3',
      className,
    ].join(' ')}>
      {groups.map((g) => (
        <section key={g.key} className="rounded-lg bg-gray-50 p-3">
          <div className="mb-2 text-gray-700 font-medium text-sm px-1">{g.title}</div>
          <Steps items={g.items} activeKey={activeKey} onChange={onChange} />
        </section>
      ))}
    </div>
  );
}

