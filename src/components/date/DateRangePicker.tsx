"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { fieldLabel, helperText, inputBase } from '../formStyles';
import { Calendar as CalendarIcon } from 'lucide-react';
import Calendar from './Calendar';
import { addMonths, endOfMonth, formatDateTime, formatISO, parseDateStrict, parseDateTimeStrict, startOfMonth } from './utils';

type DisabledRange = { start: string | Date; end: string | Date; reason?: string };

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
  disabledDates?: Array<string | Date>;
  disabledRanges?: DisabledRange[];
  disabledWeekdays?: number[];
  disabledBefore?: string | Date;
  disabledAfter?: string | Date;
  requireConfirm?: boolean;
  shortcutRequireConfirm?: boolean;
  showThisMonthShortcut?: boolean;
  enableTime?: boolean;
  defaultTimeOn?: boolean;
  onChange?: (start?: string, end?: string) => void;
  className?: string;
};

export default function DateRangePicker({
  label,
  helper,
  start,
  end,
  defaultStart,
  defaultEnd,
  min,
  max,
  disabledDate,
  disabledDates = [],
  disabledRanges = [],
  disabledWeekdays = [],
  disabledBefore,
  disabledAfter,
  requireConfirm = true,
  shortcutRequireConfirm,
  showThisMonthShortcut = true,
  enableTime = false,
  defaultTimeOn = false,
  onChange,
  className = '',
}: Props) {
  const isControlled = typeof start !== 'undefined' || typeof end !== 'undefined';
  const [s, setS] = useState<string | undefined>(defaultStart);
  const [e, setE] = useState<string | undefined>(defaultEnd);
  const sv = isControlled ? start : s;
  const ev = isControlled ? end : e;

  const today = useMemo(() => new Date(), []);
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState<Date>(() => startOfMonth(today));
  const [right, setRight] = useState<Date>(() => addMonths(startOfMonth(today), 1));
  const [hoverDate, setHoverDate] = useState<Date | undefined>(undefined);
  const pop = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<'start'|'end'|'auto'>('auto');

  const [timeOn, setTimeOn] = useState<boolean>(!!defaultTimeOn);
  const [startTime, setStartTime] = useState<string | undefined>(undefined);
  const [endTime, setEndTime] = useState<string | undefined>(undefined);

  const [draftStart, setDraftStart] = useState<Date | undefined>(undefined);
  const [draftEnd, setDraftEnd] = useState<Date | undefined>(undefined);
  const [draftStartInput, setDraftStartInput] = useState<string>('');
  const [draftEndInput, setDraftEndInput] = useState<string>('');

  const shortcutsNeedConfirm = typeof shortcutRequireConfirm === 'boolean' ? shortcutRequireConfirm : requireConfirm;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!pop.current || !anchor.current) return;
      if (pop.current.contains(e.target as Node) || anchor.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toHHmm = (d?: Date) => {
    if (!d) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const openPanel = (focus: 'start'|'end') => {
    setActive(focus);
    const ps = sv ? parseDateTimeStrict(sv) : undefined;
    const pe = ev ? parseDateTimeStrict(ev) : undefined;
    const hasAnyTime = !!(ps?.hasTime || pe?.hasTime);
    setTimeOn(enableTime ? (hasAnyTime || defaultTimeOn) : false);
    setDraftStart(ps?.date || (sv ? parseDateStrict(sv) : undefined));
    setDraftEnd(pe?.date || (ev ? parseDateStrict(ev) : undefined));
    setDraftStartInput(sv || '');
    setDraftEndInput(ev || '');
    setStartTime(ps && ps.hasTime ? toHHmm(ps.date) : undefined);
    setEndTime(pe && pe.hasTime ? toHHmm(pe.date) : undefined);
    setLeft(startOfMonth(today));
    setRight(addMonths(startOfMonth(today), 1));
    setHoverDate(undefined);
    setOpen(true);
  };

  function toDate(v?: string | Date): Date | undefined {
    if (!v) return undefined;
    if (v instanceof Date) return v;
    const p1 = parseDateTimeStrict(v);
    if (p1) return p1.date;
    return parseDateStrict(v);
  }
  const disabledBeforeDate = useMemo(() => toDate(disabledBefore), [disabledBefore]);
  const disabledAfterDate = useMemo(() => toDate(disabledAfter), [disabledAfter]);
  const minD = useMemo(() => parseDateStrict(min || ''), [min]);
  const maxD = useMemo(() => parseDateStrict(max || ''), [max]);
  const disabledDatesSet = useMemo(() => new Set((disabledDates || []).map(d => formatISO(toDate(d)!) ).filter(Boolean)), [disabledDates]);
  const ranges = useMemo(() => (disabledRanges || []).map(r => ({ start: toDate(r.start)!, end: toDate(r.end)!, reason: r.reason })), [disabledRanges]);
  const weekdayDisabled = (d: Date) => (disabledWeekdays || []).includes(d.getDay());
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  const inDisabledRanges = (d: Date) => ranges.find(r => d >= startOfDay(r.start) && d <= endOfDay(r.end));
  const isOutOfBound = (d: Date) => {
    if (minD && d < minD) return true;
    if (maxD && d > maxD) return true;
    if (disabledBeforeDate && d < disabledBeforeDate) return true;
    if (disabledAfterDate && d > disabledAfterDate) return true;
    return false;
  };
  const isDisabledBase = (d: Date) => {
    if (disabledDate?.(d)) return true;
    if (isOutOfBound(d)) return true;
    if (weekdayDisabled(d)) return true;
    if (disabledDatesSet.has(formatISO(d))) return true;
    if (inDisabledRanges(d)) return true;
    return false;
  };
  // 左（开始）与右（结束）各自的禁用规则
  const isDisabledStartPick = (d: Date) => {
    if (isDisabledBase(d)) return true;
    if (draftEnd) return d > endOfDay(draftEnd);
    return false;
  };
  const isDisabledEndPick = (d: Date) => {
    if (isDisabledBase(d)) return true;
    if (draftStart) return d < startOfDay(draftStart);
    return false;
  };

  const doConfirm = () => {
    const ps = draftStartInput.trim();
    const pe = draftEndInput.trim();
    const sd = ps ? parseDateTimeStrict(ps) : undefined;
    const ed = pe ? parseDateTimeStrict(pe) : undefined;
    let outS: string | undefined = undefined;
    let outE: string | undefined = undefined;
    if (sd?.date) {
      if (timeOn) {
        const has = sd.hasTime ? sd.date : (startTime ? new Date(sd.date.getFullYear(), sd.date.getMonth(), sd.date.getDate(), Number(startTime.split(':')[0]), Number(startTime.split(':')[1])) : undefined);
        outS = has ? formatDateTime(has) : formatISO(sd.date);
      } else {
        outS = formatISO(sd.date);
      }
    }
    if (ed?.date) {
      if (timeOn) {
        const has = ed.hasTime ? ed.date : (endTime ? new Date(ed.date.getFullYear(), ed.date.getMonth(), ed.date.getDate(), Number(endTime.split(':')[0]), Number(endTime.split(':')[1])) : undefined);
        outE = has ? formatDateTime(has) : formatISO(ed.date);
      } else {
        outE = formatISO(ed.date);
      }
    }
    if (!isControlled) { setS(outS); setE(outE); }
    onChange?.(outS, outE);
    setOpen(false);
  };

  const doClear = () => {
    if (!isControlled) { setS(undefined); setE(undefined); }
    onChange?.(undefined, undefined);
    setDraftStart(undefined); setDraftEnd(undefined); setDraftStartInput(''); setDraftEndInput(''); setStartTime(undefined); setEndTime(undefined);
    setOpen(false);
  };

  const selectStart = (d: Date) => {
    if (isDisabledStartPick(d)) return;
    const pick = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    setDraftStart(pick);
    setDraftStartInput(formatISO(pick));
  };
  const selectEnd = (d: Date) => {
    if (isDisabledEndPick(d)) return;
    const pick = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    setDraftEnd(pick);
    setDraftEndInput(formatISO(pick));
  };
  // 键盘选中：依赖当前 active 面板
  const select = (d: Date) => {
    if (active === 'start') return selectStart(d);
    if (active === 'end') return selectEnd(d);
  };

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div ref={anchor} className={`relative ${className}`}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder={'开始日期'}
              value={open ? draftStartInput : (sv ?? '')}
              onFocus={() => openPanel('start')}
              onClick={() => openPanel('start')}
              onChange={(e) => { setDraftStartInput(e.target.value); }}
              className={`${inputBase} text-left pr-10 leading-none flex items-center h-10 ${active === 'start' ? 'ring-2 ring-primary/60 border-transparent' : ''} ${(open ? !draftStartInput : !sv) ? 'text-gray-400' : 'text-gray-700'}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
          </div>
          <span className="text-xs text-gray-500">至</span>
          <div className="relative">
            <input
              type="text"
              placeholder={'结束日期'}
              value={open ? draftEndInput : (ev ?? '')}
              onFocus={() => openPanel('end')}
              onClick={() => openPanel('end')}
              onChange={(e) => { setDraftEndInput(e.target.value); }}
              className={`${inputBase} text-left pr-10 leading-none flex items-center h-10 ${active === 'end' ? 'ring-2 ring-primary/60 border-transparent' : ''} ${(open ? !draftEndInput : !ev) ? 'text-gray-400' : 'text-gray-700'}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
          </div>
        </div>

        {open && (
          <div ref={pop} className="absolute z-20 mt-1 w-[560px] rounded-lg border border-gray-200 bg-white p-2 shadow-elevation-1">

            <div className="flex gap-2" tabIndex={0} onKeyDown={(e) => {
              const base = hoverDate || (active === 'start' ? (draftStart || left) : (draftEnd || right));
              const stepDays = (d: Date, n: number) => { const t = new Date(d); t.setDate(t.getDate() + n); return t; };
              const clampToPanel = (next: Date) => {
                const leftStart = startOfMonth(left); const rightEnd = endOfMonth(right);
                if (next < leftStart) { const nm = startOfMonth(next); setLeft(nm); setRight(addMonths(nm, 1)); }
                if (next > rightEnd) { const nm = startOfMonth(next); setLeft(addMonths(nm, -1)); setRight(nm); }
              };
              const move = (n: number) => {
                let next = stepDays(base, n);
                let guard = 0;
                const disabledForKey = active === 'start' ? isDisabledStartPick : isDisabledEndPick;
                while (disabledForKey(next) && guard < 31) { next = stepDays(next, n > 0 ? 1 : -1); guard++; }
                clampToPanel(next); setHoverDate(next);
              };
              if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
              if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
              if (e.key === 'ArrowUp') { e.preventDefault(); move(-7); }
              if (e.key === 'ArrowDown') { e.preventDefault(); move(7); }
              if (e.key === 'Enter') { e.preventDefault(); select(base); }
              if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
            }}>
              <Calendar
                month={left}
                rangeStart={draftStart}
                rangeEnd={draftEnd}
                min={minD}
                max={maxD}
                disabledDate={isDisabledStartPick}
                hoverDate={hoverDate}
                onHoverDate={setHoverDate}
                onMonthChange={(m) => { setLeft(m); setActive('start'); }}
                onSelect={selectStart}
                panel={'start'}
              />
              <Calendar
                month={right}
                rangeStart={draftStart}
                rangeEnd={draftEnd}
                min={minD}
                max={maxD}
                disabledDate={isDisabledEndPick}
                hoverDate={hoverDate}
                onHoverDate={setHoverDate}
                onMonthChange={(m) => { setRight(m); setActive('end'); }}
                onSelect={selectEnd}
                panel={'end'}
              />
            </div>

            {enableTime && timeOn && (
              <div className="mb-2 grid grid-cols-2 gap-2 px-1">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-10 text-right text-gray-500">开始</span>
                  <select className="h-8 rounded border border-gray-200 px-1" value={startTime || ''} onChange={(e) => { setStartTime(e.target.value); }}>
                    <option value="" disabled>选择时分</option>
                    {Array.from({ length: 24 }, (_, h) => h).map(h => (
                      Array.from({ length: 60 }, (_, m) => m).map(m => {
                        const hh = String(h).padStart(2, '0'); const mm = String(m).padStart(2, '0'); const v = `${hh}:${mm}`;
                        return <option key={`s-${v}`} value={v}>{v}</option>;
                      })
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-10 text-right text-gray-500">结束</span>
                  <select className="h-8 rounded border border-gray-200 px-1" value={endTime || ''} onChange={(e) => { setEndTime(e.target.value); }}>
                    <option value="" disabled>选择时分</option>
                    {Array.from({ length: 24 }, (_, h) => h).map(h => (
                      Array.from({ length: 60 }, (_, m) => m).map(m => {
                        const hh = String(h).padStart(2, '0'); const mm = String(m).padStart(2, '0'); const v = `${hh}:${mm}`;
                        return <option key={`e-${v}`} value={v}>{v}</option>;
                      })
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex gap-2">
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => {
                  const d = new Date(); const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  if (active === 'end') {
                    setDraftEnd(day); setDraftEndInput(formatISO(day));
                    const rightM = startOfMonth(day); setRight(rightM);
                  } else {
                    setDraftStart(day); setDraftStartInput(formatISO(day));
                    const leftM = startOfMonth(day); setLeft(leftM);
                  }
                  if (!shortcutsNeedConfirm) { doConfirm(); }
                }}>今天</button>
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() - 1); const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  if (active === 'end') {
                    setDraftEnd(day); setDraftEndInput(formatISO(day));
                    const rightM = startOfMonth(day); setRight(rightM);
                  } else {
                    setDraftStart(day); setDraftStartInput(formatISO(day));
                    const leftM = startOfMonth(day); setLeft(leftM);
                  }
                  if (!shortcutsNeedConfirm) { doConfirm(); }
                }}>昨天</button>
              </div>
              <div className="flex items-center gap-2">
                {requireConfirm && (
                  <>
                    <button type="button" className="h-8 rounded-md border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50" onClick={doClear}>清除</button>
                    <button type="button" className="h-8 rounded-md border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>取消</button>
                    <button type="button" className={`h-8 rounded-md px-3 text-sm text-white bg-primary hover:bg-primary/90`} onClick={doConfirm}>确定</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
