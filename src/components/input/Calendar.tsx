"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, endOfMonth, inRange, isSameDay, startOfMonth } from './utils';

type Props = {
  value?: Date;
  focusDate?: Date;
  defaultMonth?: Date;
  min?: Date;
  max?: Date;
  disabledDate?: (d: Date) => boolean;
  disabledReason?: (d: Date) => string | undefined;
  onSelect?: (d: Date) => void;
  onVisibleMonthChange?: (d: Date) => void;
  rangeStart?: Date;
  rangeEnd?: Date;
  hoverDate?: Date;
  onHoverDate?: (d?: Date) => void;
  panel?: 'start' | 'end';
};

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function normalizeMonth(date: Date) {
  return startOfMonth(date);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export default function Calendar({
  value,
  focusDate,
  defaultMonth,
  min,
  max,
  disabledDate,
  disabledReason,
  onSelect,
  onVisibleMonthChange,
  rangeStart,
  rangeEnd,
  hoverDate,
  onHoverDate,
  panel,
}: Props) {
  const resolveInitial = () => {
    if (defaultMonth) return normalizeMonth(defaultMonth);
    if (value) return normalizeMonth(value);
    if (panel === 'start' && rangeStart) return normalizeMonth(rangeStart);
    if (panel === 'end') {
      if (rangeEnd) return normalizeMonth(rangeEnd);
      if (rangeStart) return normalizeMonth(addMonths(rangeStart, 1));
    }
    return normalizeMonth(new Date());
  };

  const [view, setView] = useState<'date' | 'year' | 'month'>('date');
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => resolveInitial());
  const userNavigatedRef = useRef(false);
  const defaultMonthKeyRef = useRef<string | undefined>();

  const updateVisibleMonth = useCallback(
    (next: Date, source: 'user' | 'value' | 'focus' | 'default') => {
      const normalized = normalizeMonth(next);
      const currentKey = monthKey(visibleMonth);
      const nextKey = monthKey(normalized);
      if (currentKey === nextKey) {
        if (source === 'user' || source === 'focus') userNavigatedRef.current = true;
        if (source === 'value' || source === 'default') userNavigatedRef.current = false;
        return;
      }
      setVisibleMonth(normalized);
      if (source === 'user' || source === 'focus') userNavigatedRef.current = true;
      else userNavigatedRef.current = false;
      onVisibleMonthChange?.(normalized);
    },
    [onVisibleMonthChange, visibleMonth],
  );

  useEffect(() => {
    if (!value) {
      defaultMonthKeyRef.current = undefined;
      return;
    }
    updateVisibleMonth(value, 'value');
    defaultMonthKeyRef.current = undefined;
  }, [updateVisibleMonth, value]);

  useEffect(() => {
    if (!focusDate) return;
    updateVisibleMonth(focusDate, 'focus');
  }, [focusDate, updateVisibleMonth]);

  useEffect(() => {
    if (!defaultMonth) {
      defaultMonthKeyRef.current = undefined;
      return;
    }
    if (value) return;
    if (userNavigatedRef.current) return;
    const key = monthKey(normalizeMonth(defaultMonth));
    if (defaultMonthKeyRef.current === key) return;
    defaultMonthKeyRef.current = key;
    updateVisibleMonth(defaultMonth, 'default');
  }, [defaultMonth, updateVisibleMonth, value]);

  useEffect(() => {
    if (panel !== 'end' || value || defaultMonth || userNavigatedRef.current) return;
    if (!rangeStart || rangeEnd) return;
    updateVisibleMonth(addMonths(rangeStart, 1), 'default');
  }, [defaultMonth, panel, rangeEnd, rangeStart, updateVisibleMonth, value]);

  const first = startOfMonth(visibleMonth);
  const last = endOfMonth(visibleMonth);
  const firstWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = last.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const canPick = (d: Date) => inRange(d, min, max) && !(disabledDate?.(d));

  const years = useMemo(() => {
    const y = visibleMonth.getFullYear();
    const start = y - 9;
    return Array.from({ length: 20 }, (_, i) => start + i);
  }, [visibleMonth]);

  const changeYear = (y: number) => {
    updateVisibleMonth(new Date(y, visibleMonth.getMonth(), 1), 'user');
    setView('date');
  };
  const changeMonth = (m: number) => {
    updateVisibleMonth(new Date(visibleMonth.getFullYear(), m, 1), 'user');
    setView('date');
  };

  const showHoverRange = !!(rangeStart && !rangeEnd && hoverDate);

  return (
    <div className="w-64 select-none">
      <div className="flex items-center justify-between gap-2 px-2 py-2">
        <button
          type="button"
          aria-label="上一月"
          className="h-7 w-7 rounded hover:bg-gray-100"
          onClick={() => updateVisibleMonth(addMonths(visibleMonth, view === 'date' ? -1 : -12), 'user')}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <button type="button" className="h-7 rounded px-2 hover:bg-gray-100" onClick={() => setView('year')}>
            {visibleMonth.getFullYear()}年
          </button>
          <button type="button" className="h-7 rounded px-2 hover:bg-gray-100" onClick={() => setView('month')}>
            {visibleMonth.getMonth() + 1}月
          </button>
        </div>
        <button
          type="button"
          aria-label="下一月"
          className="h-7 w-7 rounded hover:bg-gray-100"
          onClick={() => updateVisibleMonth(addMonths(visibleMonth, view === 'date' ? 1 : 12), 'user')}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      {view === 'year' && (
        <div className="grid grid-cols-4 gap-2 px-2 pb-2">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              className={`h-8 rounded text-sm hover:bg-gray-100 ${y === visibleMonth.getFullYear() ? 'bg-primary/10 text-primary' : 'text-gray-700'}`}
              onClick={() => changeYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
      )}
      {view === 'month' && (
        <div className="grid grid-cols-3 gap-2 px-2 pb-2">
          {Array.from({ length: 12 }, (_, m) => (
            <button
              key={m}
              type="button"
              className={`h-8 rounded text-sm hover:bg-gray-100 ${m === visibleMonth.getMonth() ? 'bg-primary/10 text-primary' : 'text-gray-700'}`}
              onClick={() => changeMonth(m)}
            >
              {m + 1}月
            </button>
          ))}
        </div>
      )}
      {view === 'date' && (
        <>
          <div className="grid grid-cols-7 gap-1 px-2 pb-2 text-center text-[11px] text-gray-500">
            {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-x-0 gap-y-1 px-2 pb-2">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="h-8" />;
              const disabled = !canPick(d);
              const singleSelected = !!(value && isSameDay(d, value));
              const isStart = !!(rangeStart && isSameDay(d, rangeStart));
              const isEnd = !!(rangeEnd && isSameDay(d, rangeEnd));
              const selectedEdge = isStart || isEnd;
              const inSelectedRange = !!(rangeStart && rangeEnd && d >= rangeStart && d <= rangeEnd);
              const inHoverRange =
                !!(
                  showHoverRange &&
                  rangeStart &&
                  hoverDate &&
                  ((hoverDate > rangeStart && d >= rangeStart && d <= hoverDate) ||
                    (hoverDate < rangeStart && d >= hoverDate && d <= rangeStart))
                );
              const sameDayEdge = !!(rangeStart && rangeEnd && isSameDay(rangeStart, rangeEnd) && isStart && isEnd);
              const title = disabled ? disabledReason?.(d) || undefined : undefined;
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
                    'h-8 text-sm focus:outline-none focus:ring-0',
                    disabled ? 'text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed' : 'hover:bg-gray-100',
                    !disabled && singleSelected ? 'bg-primary text-white hover:bg-primary/90' : '',
                    !disabled && !singleSelected && (sameDayEdge || (panel === 'start' && isStart) || (panel === 'end' && isEnd))
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : '',
                    !disabled &&
                    !singleSelected &&
                    !sameDayEdge &&
                    rangeStart &&
                    rangeEnd &&
                    ((panel === 'start' && isEnd) || (panel === 'end' && isStart))
                      ? 'relative z-10 bg-primary/20 text-primary/60 ring-1 ring-primary/60'
                      : '',
                    !disabled && !singleSelected && !selectedEdge && inSelectedRange ? 'bg-gray-100 text-gray-500' : '',
                    !disabled && !singleSelected && !inSelectedRange && !selectedEdge ? 'text-gray-700' : '',
                    !disabled && inHoverRange ? 'bg-gray-50 text-gray-600' : '',
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
