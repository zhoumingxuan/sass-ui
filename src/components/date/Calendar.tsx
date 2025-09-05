"use client";

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, endOfMonth, inRange, isSameDay, startOfMonth } from './utils';

type Props = {
  month: Date; // any date in the month to render
  value?: Date;
  min?: Date;
  max?: Date;
  disabledDate?: (d: Date) => boolean;
  onSelect?: (d: Date) => void;
  onMonthChange?: (d: Date) => void;
  rangeStart?: Date;
  rangeEnd?: Date;
  // For range selecting: when only start is chosen, highlight hover-to day
  hoverDate?: Date;
  onHoverDate?: (d?: Date) => void;
};

export default function Calendar({ month, value, min, max, disabledDate, onSelect, onMonthChange, rangeStart, rangeEnd, hoverDate, onHoverDate }: Props) {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const firstWeekday = (first.getDay() + 6) % 7; // make Monday=0
  const daysInMonth = last.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const canPick = (d: Date) => inRange(d, min, max) && !(disabledDate?.(d));

  const years = useMemo(() => {
    const y = month.getFullYear();
    const arr: number[] = [];
    for (let i = y - 50; i <= y + 50; i++) arr.push(i);
    return arr;
  }, [month]);

  const onChangeYear = (y: number) => onMonthChange?.(new Date(y, month.getMonth(), 1));
  const onChangeMonth = (m: number) => onMonthChange?.(new Date(month.getFullYear(), m, 1));

  const showHoverRange = !!(rangeStart && !rangeEnd && hoverDate);

  return (
    <div className="w-64 select-none">
      <div className="flex items-center justify-between gap-2 px-2 py-2">
        <button type="button" aria-label="上个月" className="h-7 w-7 rounded hover:bg-gray-100" onClick={() => onMonthChange?.(addMonths(month, -1))}>
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <select aria-label="年份" className="h-7 rounded-md border border-gray-200 bg-white px-2 text-sm" value={month.getFullYear()} onChange={(e) => onChangeYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select aria-label="月份" className="h-7 rounded-md border border-gray-200 bg-white px-2 text-sm" value={month.getMonth()} onChange={(e) => onChangeMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i).map((m) => (
              <option key={m} value={m}>{m + 1}月</option>
            ))}
          </select>
        </div>
        <button type="button" aria-label="下个月" className="h-7 w-7 rounded hover:bg-gray-100" onClick={() => onMonthChange?.(addMonths(month, 1))}>
          <ChevronRight size={16} />
        </button>
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
          const selected = isSameDay(d, value) || isSameDay(d, rangeStart) || isSameDay(d, rangeEnd);
          const inSelectedRange = !!(rangeStart && rangeEnd && d >= rangeStart && d <= rangeEnd);
          const isStart = !!(rangeStart && isSameDay(d, rangeStart));
          const isEnd = !!(rangeEnd && isSameDay(d, rangeEnd));
          const inHoverRange = !!(showHoverRange && rangeStart && hoverDate && ((hoverDate > rangeStart && d >= rangeStart && d <= hoverDate) || (hoverDate < rangeStart && d >= hoverDate && d <= rangeStart)));
          return (
            <button
              type="button"
              key={i}
              disabled={disabled}
              onMouseEnter={() => onHoverDate?.(d)}
              onMouseLeave={() => onHoverDate?.(undefined)}
              onClick={() => !disabled && onSelect?.(d)}
              className={[
                'h-8 rounded text-sm',
                disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-primary/10',
                selected && (isStart || isEnd) ? 'bg-primary text-white hover:bg-primary/90' : '',
                !selected && inSelectedRange ? 'bg-primary/10 text-primary' : '',
                !selected && !inSelectedRange ? 'text-gray-700' : '',
                inHoverRange ? 'bg-primary/5 text-primary' : '',
                isStart ? 'rounded-l' : '',
                isEnd ? 'rounded-r' : '',
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

