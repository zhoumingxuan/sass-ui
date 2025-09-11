"use client";

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, endOfMonth, inRange, isSameDay, startOfMonth } from './utils';

type Props = {
  month: Date; // any date in the month to render
  value?: Date;
  min?: Date;
  max?: Date;
  disabledDate?: (d: Date) => boolean;
  disabledReason?: (d: Date) => string | undefined;
  onSelect?: (d: Date) => void;
  onMonthChange?: (d: Date) => void;
  rangeStart?: Date;
  rangeEnd?: Date;
  // For range selecting: when only start is chosen, highlight hover-to day
  hoverDate?: Date;
  onHoverDate?: (d?: Date) => void;
};

export default function Calendar({ month, value, min, max, disabledDate, disabledReason, onSelect, onMonthChange, rangeStart, rangeEnd, hoverDate, onHoverDate }: Props) {
  const [view, setView] = useState<'date'|'year'|'month'>('date');
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
    const start = y - 9;
    return Array.from({ length: 20 }, (_, i) => start + i);
  }, [month]);

  const onChangeYear = (y: number) => { onMonthChange?.(new Date(y, month.getMonth(), 1)); setView('date'); };
  const onChangeMonth = (m: number) => { onMonthChange?.(new Date(month.getFullYear(), m, 1)); setView('date'); };

  const showHoverRange = !!(rangeStart && !rangeEnd && hoverDate);

  return (
    <div className="w-64 select-none">
      <div className="flex items-center justify-between gap-2 px-2 py-2">
        <button type="button" aria-label="上一页" className="h-7 w-7 rounded hover:bg-gray-100" onClick={() => onMonthChange?.(addMonths(month, view === 'date' ? -1 : -12))}>
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <button type="button" className="h-7 rounded px-2 hover:bg-gray-100" onClick={() => setView('year')}>{month.getFullYear()}年</button>
          <button type="button" className="h-7 rounded px-2 hover:bg-gray-100" onClick={() => setView('month')}>{month.getMonth() + 1}月</button>
        </div>
        <button type="button" aria-label="下一页" className="h-7 w-7 rounded hover:bg-gray-100" onClick={() => onMonthChange?.(addMonths(month, view === 'date' ? 1 : 12))}>
          <ChevronRight size={16} />
        </button>
      </div>
      {view === 'year' && (
        <div className="grid grid-cols-4 gap-2 px-2 pb-2">
          {years.map((y) => (
            <button key={y} type="button" className={`h-8 rounded text-sm hover:bg-gray-100 ${y === month.getFullYear() ? 'bg-primary/10 text-primary' : 'text-gray-700'}`} onClick={() => onChangeYear(y)}>
              {y}
            </button>
          ))}
        </div>
      )}
      {view === 'month' && (
        <div className="grid grid-cols-3 gap-2 px-2 pb-2">
          {Array.from({ length: 12 }, (_, m) => (
            <button key={m} type="button" className={`h-8 rounded text-sm hover:bg-gray-100 ${m === month.getMonth() ? 'bg-primary/10 text-primary' : 'text-gray-700'}`} onClick={() => onChangeMonth(m)}>
              {m + 1}月
            </button>
          ))}
        </div>
      )}
      {view === 'date' && (
        <>
          <div className="grid grid-cols-7 gap-1 px-2 pb-2 text-center text-[11px] text-gray-500">
            {['一','二','三','四','五','六','日'].map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 px-2 pb-2">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="h-8"/>;
              const disabled = !canPick(d);
              const singleSelected = !!(value && isSameDay(d, value));
              const isStart = !!(rangeStart && isSameDay(d, rangeStart));
              const isEnd = !!(rangeEnd && isSameDay(d, rangeEnd));
              const selectedEdge = isStart || isEnd;
              const inSelectedRange = !!(rangeStart && rangeEnd && d >= rangeStart && d <= rangeEnd);
              const inHoverRange = !!(showHoverRange && rangeStart && hoverDate && ((hoverDate > rangeStart && d >= rangeStart && d <= hoverDate) || (hoverDate < rangeStart && d >= hoverDate && d <= rangeStart)));
              const title = disabled ? (disabledReason?.(d) || undefined) : undefined;
              return (
                <button
                  type="button"
                  key={i}
                  disabled={disabled}
                  aria-disabled={disabled}
                  title={title}
                  onMouseEnter={() => onHoverDate?.(d)}
                  onMouseLeave={() => onHoverDate?.(undefined)}
                  onClick={() => !disabled && onSelect?.(d)}
                  className={[
                    'h-8 rounded text-sm',
                    disabled ? 'text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed' : 'hover:bg-gray-100',
                    // single date selected styling（禁用时不渲染选中态）
                    !disabled && singleSelected ? 'bg-primary text-white hover:bg-primary/90' : '',
                    // range edges styling
                    !disabled && !singleSelected && selectedEdge ? 'bg-primary text-white hover:bg-primary/90' : '',
                    // in-range (only for range selection) use default tone, not primary
                    !disabled && !singleSelected && !selectedEdge && inSelectedRange ? 'bg-gray-100 text-gray-700' : '',
                    // default text color when not selected
                    !disabled && !singleSelected && !inSelectedRange && !selectedEdge ? 'text-gray-700' : '',
                    // hover-range preview uses default tone as well
                    !disabled && inHoverRange ? 'bg-gray-50 text-gray-700' : '',
                    isStart ? 'rounded-l' : '',
                    isEnd ? 'rounded-r' : '',
                  ].join(' ')}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
