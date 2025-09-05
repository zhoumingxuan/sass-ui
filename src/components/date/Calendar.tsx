"use client";

import { addMonths, endOfMonth, formatISO, inRange, isSameDay, startOfMonth } from './utils';

type Props = {
  month: Date; // any date in the month to render
  value?: Date;
  min?: Date;
  max?: Date;
  disabledDate?: (d: Date) => boolean;
  onSelect?: (d: Date) => void;
  onMonthChange?: (d: Date) => void;
};

export default function Calendar({ month, value, min, max, disabledDate, onSelect, onMonthChange }: Props) {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const firstWeekday = (first.getDay() + 6) % 7; // make Monday=0
  const daysInMonth = last.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const canPick = (d: Date) => inRange(d, min, max) && !(disabledDate?.(d));

  return (
    <div className="w-64 select-none">
      <div className="flex items-center justify-between px-2 py-2">
        <button type="button" className="h-7 w-7 rounded hover:bg-gray-100" onClick={() => onMonthChange?.(addMonths(month, -1))}>{'‹'}</button>
        <div className="text-sm font-medium text-gray-700">
          {month.getFullYear()}年 {month.getMonth() + 1}月
        </div>
        <button type="button" className="h-7 w-7 rounded hover:bg-gray-100" onClick={() => onMonthChange?.(addMonths(month, 1))}>{'›'}</button>
      </div>
      <div className="grid grid-cols-7 gap-1 px-2 pb-2 text-center text-[11px] text-gray-500">
        {['一','二','三','四','五','六','日'].map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 px-2 pb-2">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="h-8"/>;
          const disabled = !canPick(d);
          const selected = isSameDay(d, value);
          return (
            <button
              type="button"
              key={i}
              disabled={disabled}
              onClick={() => !disabled && onSelect?.(d)}
              className={[
                'h-8 rounded text-sm',
                disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-primary/10',
                selected ? 'bg-primary text-white hover:bg-primary/90' : 'text-gray-700',
              ].join(' ')}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

