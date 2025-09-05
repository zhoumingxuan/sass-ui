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
  const [hoverDate, setHoverDate] = useState<Date | undefined>(undefined);
  const pop = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<'start'|'end'|'auto'>('auto');

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
    const pick = formatISO(d);
    if (active === 'start') {
      // picking start explicitly
      if (ev && d > parseISO(ev)!) {
        // start > end: keep start and clear end
        commit(pick, undefined);
      } else {
        commit(pick, ev);
      }
      setActive('end'); // guide to pick end next
      return;
    }
    if (active === 'end') {
      // picking end explicitly
      if (sv && d < parseISO(sv)!) {
        // end < start: keep end only, clear start
        commit(undefined, pick);
      } else {
        commit(sv, pick);
        setOpen(false);
      }
      return;
    }
    // auto mode: first click sets start; second sets end
    if (!sv || (sv && ev)) {
      commit(pick, undefined);
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
            <input
              type="text"
              placeholder="开始日期"
              value={sv ?? ''}
              onFocus={() => { setActive('start'); setOpen(true); }}
              onClick={() => { setActive('start'); setOpen(true); }}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (raw === '') { commit(undefined, ev); return; }
                if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                  const d = parseISO(raw)!;
                  if (ev && d > parseISO(ev)!) {
                    commit(raw, undefined);
                  } else {
                    commit(raw, ev);
                  }
                }
              }}
              className={`${inputBase} text-left pr-10 leading-none flex items-center h-10 ${!sv ? 'text-gray-400' : 'text-gray-700'}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
          </div>
          <span className="text-xs text-gray-500">至</span>
          <div className="relative">
            <input
              type="text"
              placeholder="结束日期"
              value={ev ?? ''}
              onFocus={() => { setActive('end'); setOpen(true); }}
              onClick={() => { setActive('end'); setOpen(true); }}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (raw === '') { commit(sv, undefined); return; }
                if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                  const d = parseISO(raw)!;
                  if (sv && d < parseISO(sv)!) {
                    // keep end only, clear start
                    commit(undefined, raw);
                  } else {
                    commit(sv, raw);
                  }
                }
              }}
              className={`${inputBase} text-left pr-10 leading-none flex items-center h-10 ${!ev ? 'text-gray-400' : 'text-gray-700'}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
          </div>
        </div>
        {open && (
          <div ref={pop} className="absolute z-20 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-elevation-1">
            <div className="flex gap-2">
              <Calendar
                month={left}
                rangeStart={sDate}
                rangeEnd={active === 'start' ? undefined : eDate}
                min={parseISO(min)}
                max={parseISO(max)}
                hoverDate={hoverDate}
                onHoverDate={setHoverDate}
                onMonthChange={(m) => { setLeft(m); setRight(addMonths(m, 1)); }}
                onSelect={select}
              />
              <Calendar
                month={right}
                rangeStart={sDate}
                rangeEnd={active === 'start' ? undefined : eDate}
                min={parseISO(min)}
                max={parseISO(max)}
                hoverDate={hoverDate}
                onHoverDate={setHoverDate}
                onMonthChange={(m) => { setRight(m); setLeft(addMonths(m, -1)); }}
                onSelect={select}
              />
            </div>
            <div className="mt-2 flex items-center justify-between px-1">
              <div className="text-[11px] text-gray-400">可选择年份、月份、日期</div>
              <div className="flex gap-2">
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => {
                  const d = new Date();
                  commit(formatISO(d), formatISO(d));
                  setLeft(d); setRight(addMonths(d, 1));
                  setOpen(false);
                }}>今天</button>
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => {
                  const endD = new Date();
                  const startD = new Date();
                  startD.setDate(endD.getDate() - 6);
                  commit(formatISO(startD), formatISO(endD));
                  setLeft(startD); setRight(addMonths(startD, 1));
                  setOpen(false);
                }}>近7天</button>
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => {
                  const now = new Date();
                  const startD = new Date(now.getFullYear(), now.getMonth(), 1);
                  const endD = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  commit(formatISO(startD), formatISO(endD));
                  setLeft(startD); setRight(addMonths(startD, 1));
                  setOpen(false);
                }}>本月</button>
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => { commit(undefined, undefined); }}>清空</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
