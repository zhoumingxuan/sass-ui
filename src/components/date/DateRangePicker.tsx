"use client";

import { useEffect, useRef, useState } from 'react';
import { fieldLabel, helperText, inputBase } from '../formStyles';
import { Calendar as CalendarIcon } from 'lucide-react';
import Calendar from './Calendar';
import { addMonths, formatISO, parseISO, startOfMonth, endOfMonth } from './utils';

type Props = {
  label?: string;
  helper?: string;
  start?: string;
  end?: string;
  defaultStart?: string;
  defaultEnd?: string;
  min?: string;
  max?: string;
  disabledDate?: (d: Date) => boolean;
  onChange?: (start?: string, end?: string) => void;
  className?: string;
};

export default function DateRangePicker({ label, helper, start, end, defaultStart, defaultEnd, min, max, disabledDate, onChange, className = '' }: Props) {
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
    const minD = parseISO(min);
    const maxD = parseISO(max);
    const isInvalid = (d: Date) => (minD && d < minD) || (maxD && d > maxD) || !!disabledDate?.(d);
    const adjust = (v?: string): string | undefined => {
      if (!v) return undefined;
      const d0 = parseISO(v)!;
      if (!isInvalid(d0)) return v;
      let found: Date | undefined;
      for (let i = 1; i <= 366; i++) {
        const down = new Date(d0); down.setDate(d0.getDate() - i);
        if (!isInvalid(down)) { found = down; break; }
        const up = new Date(d0); up.setDate(d0.getDate() + i);
        if (!isInvalid(up)) { found = up; break; }
      }
      return found ? formatISO(found) : undefined;
    };
    let s1 = adjust(ns);
    let e1 = adjust(ne);
    if (s1 && e1) {
      const sd = parseISO(s1)!;
      const ed = parseISO(e1)!;
      if (sd > ed) { const tmp = s1; s1 = e1; e1 = tmp; }
    }
    if (!isControlled) { setS(s1); setE(e1); }
    onChange?.(s1, e1);
  };

  const select = (d: Date) => {
    if (disabledDate?.(d)) return;
    const pick = formatISO(d);
    if (active === 'start') {
      // picking start explicitly
      if (ev && d > parseISO(ev)!) {
        // start > end: keep start and clear end
        commit(pick, undefined);
      } else {
        commit(pick, ev);
      }
      setActive('end');
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
                  if (disabledDate?.(d)) return;
                  if (ev && d > parseISO(ev)!) {
                    commit(raw, undefined);
                  } else {
                    commit(raw, ev);
                  }
                }
              }}
              className={`${inputBase} text-left pr-10 leading-none flex items-center h-10 ${active === 'start' ? 'ring-2 ring-primary/60 border-transparent' : ''} ${!sv ? 'text-gray-400' : 'text-gray-700'}`}
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
                  if (disabledDate?.(d)) return;
                  if (sv && d < parseISO(sv)!) {
                    // keep end only, clear start
                    commit(undefined, raw);
                  } else {
                    commit(sv, raw);
                  }
                }
              }}
              className={`${inputBase} text-left pr-10 leading-none flex items-center h-10 ${active === 'end' ? 'ring-2 ring-primary/60 border-transparent' : ''} ${!ev ? 'text-gray-400' : 'text-gray-700'}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
          </div>
        </div>
        {open && (
          <div ref={pop} className="absolute z-20 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-elevation-1">
            <div className="flex gap-2" tabIndex={0} onKeyDown={(e) => {
              const minD = parseISO(min);
              const maxD = parseISO(max);
              const clamp = (d: Date) => {
                if (minD && d < minD) return minD;
                if (maxD && d > maxD) return maxD;
                return d;
              };
              const base = hoverDate || (active === 'start' ? (sDate || left) : (eDate || right));
              const stepDays = (d: Date, n: number) => { const t = new Date(d); t.setDate(t.getDate() + n); return t; };
              const isDisabled = (d: Date) => !!disabledDate?.(d) || (minD && d < minD) || (maxD && d > maxD);
              const move = (n: number) => {
                let next = stepDays(base, n);
                next = clamp(next);
                const leftStart = startOfMonth(left);
                const rightEnd = endOfMonth(right);
                if (next < leftStart) { const nm = startOfMonth(next); setLeft(nm); setRight(addMonths(nm, 1)); }
                if (next > rightEnd) { const nm = startOfMonth(next); setLeft(addMonths(nm, -1)); setRight(nm); }
                let guard = 0;
                while (isDisabled(next) && guard < 31) { next = stepDays(next, n > 0 ? 1 : -1); guard++; }
                setHoverDate(next);
              };
              if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
              if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
              if (e.key === 'ArrowUp') { e.preventDefault(); move(-7); }
              if (e.key === 'ArrowDown') { e.preventDefault(); move(7); }
              if (e.key === 'PageUp') { e.preventDefault(); const nm = addMonths(base, e.shiftKey ? -12 : -1); setLeft(startOfMonth(nm)); setRight(addMonths(startOfMonth(nm), 1)); setHoverDate(nm); }
              if (e.key === 'PageDown') { e.preventDefault(); const nm = addMonths(base, e.shiftKey ? 12 : 1); setLeft(addMonths(startOfMonth(nm), -1)); setRight(startOfMonth(nm)); setHoverDate(nm); }
              if (e.key === 'Enter') { e.preventDefault(); select(base); }
              if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
            }}>
              <Calendar
                month={left}
                rangeStart={sDate}
                rangeEnd={active === 'start' ? undefined : eDate}
                min={parseISO(min)}
                max={parseISO(max)}
                disabledDate={disabledDate}
                hoverDate={hoverDate}
                onHoverDate={setHoverDate}
                onMonthChange={(m) => {
                  setLeft(m); setRight(addMonths(m, 1));
                  if (active === 'start') {
                    const y = m.getFullYear();
                    const mon = m.getMonth();
                    const baseDay = sDate?.getDate() ?? 1;
                    const lastDay = new Date(y, mon + 1, 0).getDate();
                    const tryDay = (day: number) => new Date(y, mon, day);
                    const minD = parseISO(min);
                    const maxD = parseISO(max);
                    let nd: Date | undefined = tryDay(Math.min(baseDay, lastDay));
                    const isInvalid = (d: Date) => (minD && d < minD) || (maxD && d > maxD) || !!disabledDate?.(d);
                    if (nd && isInvalid(nd)) {
                      nd = undefined;
                      for (let offset = 1; offset <= lastDay; offset++) {
                        const down = baseDay - offset;
                        const up = baseDay + offset;
                        if (down >= 1) {
                          const cand = tryDay(down);
                          if (!isInvalid(cand)) { nd = cand; break; }
                        }
                        if (up <= lastDay) {
                          const cand = tryDay(up);
                          if (!isInvalid(cand)) { nd = cand; break; }
                        }
                      }
                    }
                    if (nd) {
                      if (ev && nd > parseISO(ev)!) {
                        commit(formatISO(nd), undefined);
                      } else {
                        commit(formatISO(nd), ev);
                      }
                    }
                  }
                }}
                onSelect={select}
              />
              <Calendar
                month={right}
                rangeStart={sDate}
                rangeEnd={active === 'start' ? undefined : eDate}
                min={parseISO(min)}
                max={parseISO(max)}
                disabledDate={disabledDate}
                hoverDate={hoverDate}
                onHoverDate={setHoverDate}
                onMonthChange={(m) => {
                  setRight(m); setLeft(addMonths(m, -1));
                  if (active === 'end') {
                    const y = m.getFullYear();
                    const mon = m.getMonth();
                    const baseDay = eDate?.getDate() ?? 1;
                    const lastDay = new Date(y, mon + 1, 0).getDate();
                    const tryDay = (day: number) => new Date(y, mon, day);
                    const minD = parseISO(min);
                    const maxD = parseISO(max);
                    let nd: Date | undefined = tryDay(Math.min(baseDay, lastDay));
                    const isInvalid = (d: Date) => (minD && d < minD) || (maxD && d > maxD) || !!disabledDate?.(d);
                    if (nd && isInvalid(nd)) {
                      nd = undefined;
                      for (let offset = 1; offset <= lastDay; offset++) {
                        const down = baseDay - offset;
                        const up = baseDay + offset;
                        if (down >= 1) {
                          const cand = tryDay(down);
                          if (!isInvalid(cand)) { nd = cand; break; }
                        }
                        if (up <= lastDay) {
                          const cand = tryDay(up);
                          if (!isInvalid(cand)) { nd = cand; break; }
                        }
                      }
                    }
                    if (nd) {
                      if (sv && nd < parseISO(sv)!) {
                        // keep end only, clear start
                        commit(undefined, formatISO(nd));
                      } else {
                        commit(sv, formatISO(nd));
                      }
                    }
                  }
                }}
                onSelect={select}
              />
            </div>
            <div className="mt-2 flex items-center justify-between px-1">
              <div className="text-[11px] text-gray-400">可选择年份、月份、日期</div>
              <div className="flex gap-2">
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => {
                  const base = new Date();
                  const minD = parseISO(min);
                  const maxD = parseISO(max);
                  const isInvalid = (d: Date) => (minD && d < minD) || (maxD && d > maxD) || !!disabledDate?.(d);
                  let nd: Date | undefined = base;
                  if (isInvalid(base)) {
                    nd = undefined;
                    for (let i = 1; i <= 366; i++) {
                      const down = new Date(base); down.setDate(base.getDate() - i);
                      if (!isInvalid(down)) { nd = down; break; }
                      const up = new Date(base); up.setDate(base.getDate() + i);
                      if (!isInvalid(up)) { nd = up; break; }
                    }
                  }
                  if (nd) {
                    commit(formatISO(nd), formatISO(nd));
                    setLeft(nd); setRight(addMonths(nd, 1));
                    setOpen(false);
                  }
                }}>今天</button>
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => {
                  const minD = parseISO(min);
                  const maxD = parseISO(max);
                  const isInvalid = (d: Date) => (minD && d < minD) || (maxD && d > maxD) || !!disabledDate?.(d);
                  const baseEnd = new Date();
                  let endD: Date | undefined = baseEnd;
                  if (isInvalid(baseEnd)) {
                    endD = undefined;
                    for (let i = 1; i <= 366; i++) {
                      const down = new Date(baseEnd); down.setDate(baseEnd.getDate() - i);
                      if (!isInvalid(down)) { endD = down; break; }
                      const up = new Date(baseEnd); up.setDate(baseEnd.getDate() + i);
                      if (!isInvalid(up)) { endD = up; break; }
                    }
                  }
                  if (!endD) return;
                  const baseStart = new Date(endD); baseStart.setDate(endD.getDate() - 6);
                  let startD: Date | undefined = baseStart;
                  if (isInvalid(baseStart) || baseStart > endD) {
                    startD = undefined;
                    for (let i = 0; i <= 366; i++) {
                      const cand = new Date(endD); cand.setDate(endD.getDate() - i);
                      if (!isInvalid(cand)) { startD = cand; break; }
                    }
                  }
                  if (startD && endD) {
                    commit(formatISO(startD), formatISO(endD));
                    setLeft(startD); setRight(addMonths(startD, 1));
                    setOpen(false);
                  }
                }}>近7天</button>
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => {
                  const now = new Date();
                  const mStart = startOfMonth(now);
                  const mEnd = endOfMonth(now);
                  const minD = parseISO(min);
                  const maxD = parseISO(max);
                  const inRange = (d: Date) => (!minD || d >= minD) && (!maxD || d <= maxD) && !disabledDate?.(d);
                  let startD: Date | undefined = undefined;
                  for (let d = new Date(mStart); d <= mEnd; d.setDate(d.getDate() + 1)) {
                    const cand = new Date(d);
                    if (inRange(cand)) { startD = cand; break; }
                  }
                  let endD: Date | undefined = undefined;
                  for (let d = new Date(mEnd); d >= mStart; d.setDate(d.getDate() - 1)) {
                    const cand = new Date(d);
                    if (inRange(cand)) { endD = cand; break; }
                  }
                  if (startD && endD) {
                    commit(formatISO(startD), formatISO(endD));
                    setLeft(startD); setRight(addMonths(startD, 1));
                    setOpen(false);
                  }
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
