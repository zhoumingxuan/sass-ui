"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { fieldLabel, helperText, inputBase } from '../formStyles';
import { Calendar as CalendarIcon } from 'lucide-react';
import Calendar from './Calendar';
import { addMonths, endOfMonth, formatISO, parseDateStrict, startOfMonth } from './utils';

type DisabledRange = { start: string | Date; end: string | Date; reason?: string };

type Props = {
  label?: string;
  helper?: string;
  // legacy single props (kept for compatibility)
  start?: string;
  end?: string;
  defaultStart?: string;
  defaultEnd?: string;
  // form-friendly tuple props
  value?: [string | undefined, string | undefined];
  defaultValue?: [string | undefined, string | undefined];
  min?: string;
  max?: string;
  disabledDate?: (d: Date) => boolean;
  disabledDates?: Array<string | Date>;
  disabledRanges?: DisabledRange[];
  disabledWeekdays?: number[];
  disabledBefore?: string | Date;
  disabledAfter?: string | Date;
  shortcutRequireConfirm?: boolean;
  showThisMonthShortcut?: boolean;
  onChange?: ((start?: string, end?: string) => void) | ((value: [string | undefined, string | undefined]) => void);
  className?: string;
};

export default function DateRangePicker({
  label,
  helper,
  start,
  end,
  defaultStart,
  defaultEnd,
  value,
  defaultValue,
  min,
  max,
  disabledDate,
  disabledDates = [],
  disabledRanges = [],
  disabledWeekdays = [],
  disabledBefore,
  disabledAfter,
  shortcutRequireConfirm,
  showThisMonthShortcut = true,
  onChange,
  className = '',
}: Props) {
  const tupleControlled = Array.isArray(value);
  const legacyControlled = typeof start !== 'undefined' || typeof end !== 'undefined';
  const isControlled = tupleControlled || legacyControlled;
  const [s, setS] = useState<string | undefined>(typeof defaultValue !== 'undefined' ? defaultValue?.[0] : defaultStart);
  const [e, setE] = useState<string | undefined>(typeof defaultValue !== 'undefined' ? defaultValue?.[1] : defaultEnd);
  const sv = tupleControlled ? value?.[0] : legacyControlled ? start : s;
  const ev = tupleControlled ? value?.[1] : legacyControlled ? end : e;

  const today = useMemo(() => new Date(), []);
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState<Date>(() => startOfMonth(today));
  const [right, setRight] = useState<Date>(() => addMonths(startOfMonth(today), 1));
  const [hoverDate, setHoverDate] = useState<Date | undefined>(undefined);
  const [focusDate, setFocusDate] = useState<Date | undefined>(undefined);
  const pop = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<'start'|'end'|'auto'>('auto');
  const [focused, setFocused] = useState<'start'|'end'|undefined>(undefined);

  const [draftStart, setDraftStart] = useState<Date | undefined>(undefined);
  const [draftEnd, setDraftEnd] = useState<Date | undefined>(undefined);
  const [draftStartInput, setDraftStartInput] = useState<string>('');
  const [draftEndInput, setDraftEndInput] = useState<string>('');

  type OnChangePair = (start?: string, end?: string) => void;
  type OnChangeTuple = (value: [string | undefined, string | undefined]) => void;
  const emit = (a?: string, b?: string) => {
    const fn = onChange as OnChangePair | OnChangeTuple | undefined;
    if (!fn) return;
    (fn as OnChangePair)(a, b);
    (fn as OnChangeTuple)([a, b]);
  };
  const shortcutsNeedConfirm = typeof shortcutRequireConfirm === 'boolean' ? shortcutRequireConfirm : false; void shortcutsNeedConfirm;
  void showThisMonthShortcut;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!pop.current || !anchor.current) return;
      if (pop.current.contains(e.target as Node) || anchor.current.contains(e.target as Node)) return;
      // commit drafts or keep previous
      const ps = draftStartInput.trim();
      const pe = draftEndInput.trim();
      const typedS = ps ? parseDateStrict(ps) : undefined;
      const typedE = pe ? parseDateStrict(pe) : undefined;
      const validTypedS = typedS && !isDisabledStartPick(typedS) ? typedS : undefined;
      const validTypedE = typedE && !isDisabledEndPick(typedE) ? typedE : undefined;
      let finalS: string | undefined;
      let finalE: string | undefined;
      if (ps !== '') { finalS = validTypedS ? formatISO(validTypedS) : undefined; }
      else if (draftStart) { finalS = formatISO(draftStart); }
      else { finalS = sv; }
      if (pe !== '') { finalE = validTypedE ? formatISO(validTypedE) : undefined; }
      else if (draftEnd) { finalE = formatISO(draftEnd); }
      else { finalE = ev; }
      if (!isControlled) { setS(finalS); setE(finalE); }
      emit(finalS, finalE);
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [draftStartInput, draftEndInput, draftStart, draftEnd, sv, ev, isControlled, onChange]);

  const openPanel = (focus: 'start'|'end') => {
    setFocused(focus);
    setActive(focus);
    const ps = sv ? parseDateStrict(sv) : undefined;
    const pe = ev ? parseDateStrict(ev) : undefined;

    if (!open) {
      setDraftStart(ps);
      setDraftEnd(pe);
      setDraftStartInput(sv || '');
      setDraftEndInput(ev || '');

      if (focus === 'start') {
        const base = ps || pe || today;
        const lm = startOfMonth(base);
        setLeft(lm);
        setRight(addMonths(lm, 1));
      } else {
        const base = pe || ps || today;
        const rm = startOfMonth(base);
        setRight(rm);
        setLeft(addMonths(rm, -1));
      }
      setOpen(true);
    } else {
      if (focus === 'start') setFocusDate(draftStart || ps || new Date());
      else setFocusDate(draftEnd || pe || new Date());
    }
  };

  function toDate(v?: string | Date): Date | undefined {
    if (!v) return undefined;
    if (v instanceof Date) return v;
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

  const doClear = () => {
    if (!isControlled) { setS(undefined); setE(undefined); }
    emit(undefined, undefined);
    setDraftStart(undefined); setDraftEnd(undefined); setDraftStartInput(''); setDraftEndInput('');
    setOpen(false);
  };

  const selectStart = (d: Date) => {
    if (isDisabledStartPick(d)) return;
    const pick = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    setDraftStart(pick);
    setDraftStartInput(formatISO(pick));
    setActive('end');
    if (draftEnd) {
      const outS = formatISO(pick);
      const outE = formatISO(draftEnd);
      if (!isControlled) { setS(outS); setE(outE); }
      emit(outS, outE);
      setOpen(false);
    }
  };
  const selectEnd = (d: Date) => {
    if (isDisabledEndPick(d)) return;
    const pick = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    setDraftEnd(pick);
    setDraftEndInput(formatISO(pick));
    if (draftStart) {
      const outS = formatISO(draftStart);
      const outE = formatISO(pick);
      if (!isControlled) { setS(outS); setE(outE); }
      emit(outS, outE);
      setOpen(false);
    }
  };
  const select = (d: Date) => {
    if (active === 'start') return selectStart(d);
    if (active === 'end') return selectEnd(d);
  };

  const applyTyped = (side: 'start'|'end', raw: string) => {
    const val = raw.trim();
    if (side === 'start') setDraftStartInput(raw);
    if (side === 'end') setDraftEndInput(raw);
    if (!val) {
      if (side === 'start') setDraftStart(undefined);
      if (side === 'end') setDraftEnd(undefined);
      return;
    }
    const d = parseDateStrict(val);
    if (!d) return;
    const canUse = side === 'start' ? !isDisabledStartPick(d) : !isDisabledEndPick(d);
    if (!canUse) return;
    if (side === 'start') {
      setActive('start');
      setDraftStart(d);
      const nm = startOfMonth(d);
      setLeft(nm); setRight(addMonths(nm, 1));
      setFocusDate(d);
      setDraftStartInput(formatISO(d));
    } else {
      setActive('end');
      setDraftEnd(d);
      const nm = startOfMonth(d);
      setRight(nm); setLeft(addMonths(nm, -1));
      setFocusDate(d);
      setDraftEndInput(formatISO(d));
    }
  };

  const yForBtns = new Date();
  const todayDay = new Date(yForBtns.getFullYear(), yForBtns.getMonth(), yForBtns.getDate());
  yForBtns.setDate(yForBtns.getDate() - 1);
  const yesterdayDay = new Date(yForBtns.getFullYear(), yForBtns.getMonth(), yForBtns.getDate());
  const canPickToday = focused === 'start' ? !isDisabledStartPick(todayDay) : focused === 'end' ? !isDisabledEndPick(todayDay) : true;
  const canPickYesterday = focused === 'start' ? !isDisabledStartPick(yesterdayDay) : focused === 'end' ? !isDisabledEndPick(yesterdayDay) : true;

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
              onChange={(e) => { applyTyped('start', e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const ps = draftStartInput.trim();
                  const pe = draftEndInput.trim();
                  const typedS = ps ? parseDateStrict(ps) : undefined;
                  const typedE = pe ? parseDateStrict(pe) : undefined;
                  const validTypedS = typedS && !isDisabledStartPick(typedS) ? typedS : undefined;
                  const validTypedE = typedE && !isDisabledEndPick(typedE) ? typedE : undefined;
                  let finalS: string | undefined;
                  let finalE: string | undefined;
                  if (ps !== '') { finalS = validTypedS ? formatISO(validTypedS) : undefined; }
                  else if (draftStart) { finalS = formatISO(draftStart); }
                  else { finalS = sv; }
                  if (pe !== '') { finalE = validTypedE ? formatISO(validTypedE) : undefined; }
                  else if (draftEnd) { finalE = formatISO(draftEnd); }
                  else { finalE = ev; }
                  if (!isControlled) { setS(finalS); setE(finalE); }
                  emit(finalS, finalE);
                  setOpen(false);
                }
              }}
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
              onChange={(e) => { applyTyped('end', e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const ps = draftStartInput.trim();
                  const pe = draftEndInput.trim();
                  const typedS = ps ? parseDateStrict(ps) : undefined;
                  const typedE = pe ? parseDateStrict(pe) : undefined;
                  const validTypedS = typedS && !isDisabledStartPick(typedS) ? typedS : undefined;
                  const validTypedE = typedE && !isDisabledEndPick(typedE) ? typedE : undefined;
                  let finalS: string | undefined;
                  let finalE: string | undefined;
                  if (ps !== '') { finalS = validTypedS ? formatISO(validTypedS) : undefined; }
                  else if (draftStart) { finalS = formatISO(draftStart); }
                  else { finalS = sv; }
                  if (pe !== '') { finalE = validTypedE ? formatISO(validTypedE) : undefined; }
                  else if (draftEnd) { finalE = formatISO(draftEnd); }
                  else { finalE = ev; }
                  if (!isControlled) { setS(finalS); setE(finalE); }
                  emit(finalS, finalE);
                  setOpen(false);
                }
              }}
              className={`${inputBase} text-left pr-10 leading-none flex items-center h-10 ${active === 'end' ? 'ring-2 ring-primary/60 border-transparent' : ''} ${(open ? !draftEndInput : !ev) ? 'text-gray-400' : 'text-gray-700'}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
          </div>
        </div>

        {open && (
          <div ref={pop} className="absolute z-20 mt-1 w-[560px] rounded-lg border border-gray-200 bg-white p-2 shadow-elevation-1">

            <div className="flex gap-2 outline-none focus:outline-none" tabIndex={0} onKeyDown={(e) => {
              const base = focusDate || (active === 'start' ? (draftStart || left) : (draftEnd || right) || new Date());
              const stepDays = (d: Date, n: number) => { const t = new Date(d); t.setDate(t.getDate() + n); return t; };
              const ensureVisible = (next: Date) => {
                const nm = startOfMonth(next);
                if (active === 'start') {
                  const leftStart = startOfMonth(left);
                  const rightEnd = endOfMonth(right);
                  if (next < leftStart || next > rightEnd) { setLeft(nm); setRight(addMonths(nm, 1)); }
                } else {
                  const leftStart = startOfMonth(left);
                  const rightEnd = endOfMonth(right);
                  if (next < leftStart || next > rightEnd) { setRight(nm); setLeft(addMonths(nm, -1)); }
                }
              };
              const move = (n: number) => {
                let next = stepDays(base, n);
                let guard = 0;
                const disabledForKey = active === 'start' ? isDisabledStartPick : isDisabledEndPick;
                while (disabledForKey(next) && guard < 31) { next = stepDays(next, n > 0 ? 1 : -1); guard++; }
                ensureVisible(next); setHoverDate(next); setFocusDate(next);
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
                value={draftStart}
                min={minD}
                max={maxD}
                disabledDate={isDisabledStartPick}
                hoverDate={hoverDate}
                onHoverDate={setHoverDate}
                onMonthChange={(m) => {
                  setLeft(m);
                  setActive('start');
                  const y = m.getFullYear();
                  const mon = m.getMonth();
                  const baseDay = draftStart ? draftStart.getDate() : 1;
                  const lastDay = new Date(y, mon + 1, 0).getDate();
                  const tryDay = (day: number) => new Date(y, mon, day);
                  let nd: Date | undefined = tryDay(Math.min(baseDay, lastDay));
                  if (nd && isDisabledStartPick(nd)) {
                    nd = undefined;
                    for (let offset = 1; offset <= lastDay; offset++) {
                      const down = baseDay - offset;
                      const up = baseDay + offset;
                      if (down >= 1) {
                        const cand = tryDay(down);
                        if (!isDisabledStartPick(cand)) { nd = cand; break; }
                      }
                      if (up <= lastDay) {
                        const cand = tryDay(up);
                        if (!isDisabledStartPick(cand)) { nd = cand; break; }
                      }
                    }
                  }
                  if (nd) { setDraftStart(nd); setDraftStartInput(formatISO(nd)); setFocusDate(nd); }
                }}
                onSelect={selectStart}
                panel={'start'}
              />
              <Calendar
                month={right}
                value={draftEnd}
                min={minD}
                max={maxD}
                disabledDate={isDisabledEndPick}
                hoverDate={hoverDate}
                onHoverDate={setHoverDate}
                onMonthChange={(m) => {
                  setRight(m);
                  setActive('end');
                  const y = m.getFullYear();
                  const mon = m.getMonth();
                  const baseDay = draftEnd ? draftEnd.getDate() : 1;
                  const lastDay = new Date(y, mon + 1, 0).getDate();
                  const tryDay = (day: number) => new Date(y, mon, day);
                  let nd: Date | undefined = tryDay(Math.min(baseDay, lastDay));
                  if (nd && isDisabledEndPick(nd)) {
                    nd = undefined;
                    for (let offset = 1; offset <= lastDay; offset++) {
                      const down = baseDay - offset;
                      const up = baseDay + offset;
                      if (down >= 1) {
                        const cand = tryDay(down);
                        if (!isDisabledEndPick(cand)) { nd = cand; break; }
                      }
                      if (up <= lastDay) {
                        const cand = tryDay(up);
                        if (!isDisabledEndPick(cand)) { nd = cand; break; }
                      }
                    }
                  }
                  if (nd) { setDraftEnd(nd); setDraftEndInput(formatISO(nd)); setFocusDate(nd); }
                }}
                onSelect={selectEnd}
                panel={'end'}
              />
            </div>

            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex gap-2">
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canPickToday} onClick={() => {
                  const d = new Date(); const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  if (focused === 'start') {
                    if (isDisabledStartPick(day)) return;
                    setDraftStart(day); setDraftStartInput(formatISO(day));
                    const leftM = startOfMonth(day); setLeft(leftM); setRight(addMonths(leftM, 1));
                  } else if (focused === 'end') {
                    if (isDisabledEndPick(day)) return;
                    setDraftEnd(day); setDraftEndInput(formatISO(day));
                    const rightM = startOfMonth(day); setRight(rightM); setLeft(addMonths(rightM, -1));
                  } else {
                    if (active === 'end') {
                      if (isDisabledEndPick(day)) return;
                      setDraftEnd(day); setDraftEndInput(formatISO(day));
                      const rightM = startOfMonth(day); setRight(rightM); setLeft(addMonths(rightM, -1));
                    } else {
                      if (isDisabledStartPick(day)) return;
                      setDraftStart(day); setDraftStartInput(formatISO(day));
                      const leftM = startOfMonth(day); setLeft(leftM); setRight(addMonths(leftM, 1));
                    }
                  }
                }}>今天</button>
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canPickYesterday} onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() - 1); const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  if (focused === 'start') {
                    if (isDisabledStartPick(day)) return;
                    setDraftStart(day); setDraftStartInput(formatISO(day));
                    const leftM = startOfMonth(day); setLeft(leftM); setRight(addMonths(leftM, 1));
                  } else if (focused === 'end') {
                    if (isDisabledEndPick(day)) return;
                    setDraftEnd(day); setDraftEndInput(formatISO(day));
                    const rightM = startOfMonth(day); setRight(rightM); setLeft(addMonths(rightM, -1));
                  } else {
                    if (active === 'end') {
                      if (isDisabledEndPick(day)) return;
                      setDraftEnd(day); setDraftEndInput(formatISO(day));
                      const rightM = startOfMonth(day); setRight(rightM); setLeft(addMonths(rightM, -1));
                    } else {
                      if (isDisabledStartPick(day)) return;
                      setDraftStart(day); setDraftStartInput(formatISO(day));
                      const leftM = startOfMonth(day); setLeft(leftM); setRight(addMonths(leftM, 1));
                    }
                  }
                }}>昨天</button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="h-8 rounded-md border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50" onClick={doClear}>清除</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
