"use client";

import { useEffect, useRef, useState } from 'react';
import { fieldLabel, helperText, inputBase } from '../formStyles';
import { Calendar as CalendarIcon } from 'lucide-react';
import Calendar from './Calendar';
import { addMonths, formatISO, parseISO } from './utils';

type Props = {
  label?: string;
  helper?: string;
  start?: string;
  end?: string;
  defaultStart?: string;
  defaultEnd?: string;
  min?: string;
  max?: string;
  onChange?: (start?: string, end?: string) => void;
  className?: string;
};

export default function DateRangePicker({ label, helper, start, end, defaultStart, defaultEnd, min, max, onChange, className = '' }: Props) {
  const isControlled = typeof start !== 'undefined' || typeof end !== 'undefined';
  const [s, setS] = useState<string | undefined>(defaultStart);
  const [e, setE] = useState<string | undefined>(defaultEnd);
  const sv = isControlled ? start : s;
  const ev = isControlled ? end : e;

  const sDate = parseISO(sv);
  const eDate = parseISO(ev);

  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState<Date>(() => sDate ?? new Date());
  const [right, setRight] = useState<Date>(() => addMonths(sDate ?? new Date(), 1));
  const pop = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!pop.current || !anchor.current) return;
      if (pop.current.contains(e.target as Node) || anchor.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const commit = (ns?: string, ne?: string) => {
    if (!isControlled) { setS(ns); setE(ne); }
    onChange?.(ns, ne);
  };

  const select = (d: Date) => {
    // first click sets start; second sets end
    if (!sv || (sv && ev)) {
      commit(formatISO(d), undefined);
    } else {
      const sD = parseISO(sv)!;
      if (d < sD) commit(formatISO(d), formatISO(sD));
      else commit(formatISO(sD), formatISO(d));
      setOpen(false);
    }
  };

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div ref={anchor} className={`relative ${className}`}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="relative">
            <button type="button" onClick={() => setOpen(o => !o)} className={`${inputBase} text-left pr-10 leading-none flex items-center h-10`}>{sv ?? ''}</button>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
          </div>
          <span className="text-xs text-gray-500">—</span>
          <div className="relative">
            <button type="button" onClick={() => setOpen(o => !o)} className={`${inputBase} text-left pr-10 leading-none flex items-center h-10`}>{ev ?? ''}</button>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
          </div>
        </div>
        {open && (
          <div ref={pop} className="absolute z-20 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-elevation-1">
            <div className="flex gap-2">
              <Calendar
                month={left}
                rangeStart={sDate}
                rangeEnd={eDate}
                min={parseISO(min)}
                max={parseISO(max)}
                onMonthChange={(m) => { setLeft(m); setRight(addMonths(m, 1)); }}
                onSelect={select}
              />
              <Calendar
                month={right}
                rangeStart={sDate}
                rangeEnd={eDate}
                min={parseISO(min)}
                max={parseISO(max)}
                onMonthChange={(m) => { setRight(m); setLeft(addMonths(m, -1)); }}
                onSelect={select}
              />
            </div>
          </div>
        )}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
