"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { fieldLabel, helperText, inputBase, inputSize, inputStatus, Status } from "../formStyles";
import { Calendar as CalendarIcon } from "lucide-react";
import Calendar from "./Calendar";
import { addMonths, endOfMonth, formatISO, parseDateStrict, startOfMonth } from "./utils";
import type { FormValueProps } from "../formTypes";

type DisabledRange = { start: string | Date; end: string | Date; reason?: string };

type Props = FormValueProps<[string | undefined, string | undefined]> & {
  start?: string;
  end?: string;
  min?: string;
  max?: string;
  disabledDate?: (d: Date) => boolean;
  disabledDates?: Array<string | Date>;
  disabledRanges?: DisabledRange[];
  disabledWeekdays?: number[];
  disabledBefore?: string | Date;
  disabledAfter?: string | Date;
  requireConfirm?: boolean;
  className?: string;
  status?: Status;
};

export default function DateRangePicker({
  start,
  end,
  min,
  max,
  value,
  defaultValue,
  disabledDate,
  disabledDates = [],
  disabledRanges = [],
  disabledWeekdays = [],
  disabledBefore,
  disabledAfter,
  onChange,
  className = '',
  status,
}: Props) {
  const tupleControlled = Array.isArray(value);
  const controlledStart = tupleControlled ? value?.[0] : start;
  const controlledEnd = tupleControlled ? value?.[1] : end;
  const startControlled = tupleControlled || typeof start !== 'undefined';
  const endControlled = tupleControlled || typeof end !== 'undefined';
  const [s, setS] = useState<string | undefined>(defaultValue ? defaultValue[0] : undefined);
  const [e, setE] = useState<string | undefined>(defaultValue ? defaultValue[1] : undefined);
  const sv = startControlled ? controlledStart : s;
  const ev = endControlled ? controlledEnd : e;
  useEffect(() => {
    if (startControlled) setS(controlledStart);
  }, [startControlled, controlledStart]);
  useEffect(() => {
    if (endControlled) setE(controlledEnd);
  }, [endControlled, controlledEnd]);

  const today = useMemo(() => new Date(), []);
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState<Date>(() => startOfMonth(today));
  const [right, setRight] = useState<Date>(() => addMonths(startOfMonth(today), 1));
  const [hoverDate, setHoverDate] = useState<Date | undefined>(undefined);
  const [focusDate, setFocusDate] = useState<Date | undefined>(undefined);
  const pop = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const [mountNode, setMountNode] = useState<Element | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [active, setActive] = useState<'start' | 'end' | 'auto'>('auto');
  const [focused, setFocused] = useState<'start' | 'end' | undefined>(undefined);

  const emitChange = (nextStart?: string, nextEnd?: string) => {
    onChange?.([nextStart, nextEnd]);
  };



  const [draftStart, setDraftStart] = useState<Date | undefined>(undefined);
  const [draftEnd, setDraftEnd] = useState<Date | undefined>(undefined);
  const [draftStartInput, setDraftStartInput] = useState<string>('');
  const [draftEndInput, setDraftEndInput] = useState<string>('');


  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return; // 面板未打开时，不做任何收尾/提交
      if (!pop.current || !anchor.current) return;
      if (pop.current.contains(e.target as Node) || anchor.current.contains(e.target as Node)) return;

      // Outside click: commit drafts (clear only invalid typed side)
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
      if (!startControlled) setS(finalS);
      if (!endControlled) setE(finalE);
      emitChange(finalS, finalE);
      setOpen(false);
    };
    // 与单日期选择器保持一致，使用 mousedown，避免月/年选择时误判为外部点击导致面板关闭
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, draftStartInput, draftEndInput, draftStart, draftEnd, sv, ev, startControlled, endControlled, onChange]);


  useEffect(() => { if (typeof document !== 'undefined') setMountNode(document.getElementById('layout-body') || document.body); }, []);
  useEffect(() => {
    const update = () => {
      const el = anchor.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const panelW = 560; // desired width
      let left = r.left + window.scrollX;
      const top = r.bottom + 4 + window.scrollY;
      const maxLeft = Math.max(8, window.scrollX + window.innerWidth - panelW - 8);
      if (left > maxLeft) left = maxLeft;
      setPos({ top, left });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [open]);

  const openPanel = (focus: 'start' | 'end') => {
    setFocused(focus);
    setActive(focus);
    const ps = sv ? parseDateStrict(sv) : undefined;
    const pe = ev ? parseDateStrict(ev) : undefined;

    if (!open) {
      // initialize drafts from committed values on first open
      setDraftStart(ps);
      setDraftEnd(pe);
      setDraftStartInput(sv || '');
      setDraftEndInput(ev || '');

      // Anchor panels to the relevant month and keep panels adjacent
      if (focus === 'start') {
        const base = ps || pe || today;
        const lm = startOfMonth(base);
        setLeft(lm);
      } else {
        const base = pe || ps || today;
        const rm = startOfMonth(base);
        setRight(rm);
      }
      setFocusDate(focus === 'start' ? (ps || new Date()) : (pe || new Date()));
      setHoverDate(undefined);
      setOpen(true);
    } else {
      // keep current drafts/months; only update focus date hint
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
  const disabledDatesSet = useMemo(() => new Set((disabledDates || []).map(d => formatISO(toDate(d)!)).filter(Boolean)), [disabledDates]);
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


  // Commit on input blur only when leaving the whole widget; clear only invalid input
  // removed legacy handleInputBlur (no longer used)

  const doClear = () => {
    if (!startControlled) setS(undefined);
    if (!endControlled) setE(undefined);
    emitChange(undefined, undefined);
    setDraftStart(undefined); setDraftEnd(undefined); setDraftStartInput(''); setDraftEndInput('');
    setOpen(false);
  };

  const selectStart = (d: Date) => {
    if (isDisabledStartPick(d)) return;
    const pick = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    setDraftStart(pick);
    setDraftStartInput(formatISO(pick));
    // switch to picking end
    setActive('end');
    setFocused('end');
    if (draftEnd) {
      const outS = formatISO(pick);
      const outE = formatISO(draftEnd);
      if (!startControlled) setS(outS);
      if (!endControlled) setE(outE);
      emitChange(outS, outE);
      setOpen(false);
    }
  };
  const selectEnd = (d: Date) => {
    if (isDisabledEndPick(d)) return;
    const pick = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    setDraftEnd(pick);
    setDraftEndInput(formatISO(pick));
    setFocused('end');
    if (draftStart) {
      const outS = formatISO(draftStart);
      const outE = formatISO(pick);
      if (!startControlled) setS(outS);
      if (!endControlled) setE(outE);
      emitChange(outS, outE);
      setOpen(false);
    }
  };
  // 键盘选中：依赖当前 active 面板
  const select = (d: Date) => {
    if (active === 'start') return selectStart(d);
    if (active === 'end') return selectEnd(d);
  };

  // When user types a valid date/time, auto-select and sync panel
  const applyTyped = (side: 'start' | 'end', raw: string) => {
    const val = raw.trim();
    if (side === 'start') setDraftStartInput(raw);
    if (side === 'end') setDraftEndInput(raw);
    if (!val) {
      if (side === 'start') setDraftStart(undefined);
      if (side === 'end') setDraftEnd(undefined);
      return;
    }
    const d = parseDateStrict(val);
    if (!d) return; // not a valid date format we accept
    const canUse = side === 'start' ? !isDisabledStartPick(d) : !isDisabledEndPick(d);
    if (!canUse) return;
    if (side === 'start') {
      setActive('start');
      setDraftStart(d);
      const nm = startOfMonth(d);
      // Only adjust the left panel to the typed month; do not touch right panel
      setLeft(nm);
      setFocusDate(d);
      setDraftStartInput(formatISO(d));
    } else {
      setActive('end');
      setDraftEnd(d);
      const nm = startOfMonth(d);
      // Only adjust the right panel to the typed month; do not touch left panel
      setRight(nm);
      setFocusDate(d);
      setDraftEndInput(formatISO(d));
    }
  };

  // 根据当前焦点侧，计算“今天/昨天”按钮是否可用（不可用则禁用置灰）
  const nowForBtns = new Date();
  const todayDay = new Date(nowForBtns.getFullYear(), nowForBtns.getMonth(), nowForBtns.getDate());
  const yForBtns = new Date(nowForBtns);
  yForBtns.setDate(yForBtns.getDate() - 1);
  const yesterdayDay = new Date(yForBtns.getFullYear(), yForBtns.getMonth(), yForBtns.getDate());
  const canPickToday = focused === 'start' ? !isDisabledStartPick(todayDay)
    : focused === 'end' ? !isDisabledEndPick(todayDay)
      : true;
  const canPickYesterday = focused === 'start' ? !isDisabledStartPick(yesterdayDay)
    : focused === 'end' ? !isDisabledEndPick(yesterdayDay)
      : true;

  useEffect(() => {
    if (!open) {
      setActive('auto');
      setFocused(undefined);
      setHoverDate(undefined);
      setFocusDate(undefined);
    }
  }, [open]);

  return (
      <div ref={anchor} className={`relative ${className}`}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="relative">
            <input
              type="text"
              autoComplete="off"
              placeholder={'开始日期'}
              value={open ? draftStartInput : (sv ?? '')}
              onFocus={() => openPanel('start')}
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
                  if (!startControlled) setS(finalS);
                  if (!endControlled) setE(finalE);
                  emitChange(finalS, finalE);
                  setOpen(false);
                }
              }}
              aria-invalid={status === 'error' ? true : undefined}
              className={`${inputBase} ${inputSize['md']} ${status ? inputStatus[status] : ''} text-left pr-10 ${(active === 'start' && open) ? 'ring-2 ring-primary/20 border-transparent' : ''} ${(open ? !draftStartInput : !sv) ? 'text-gray-400' : 'text-gray-700'}`}
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
                  if (!startControlled) setS(finalS);
                  if (!endControlled) setE(finalE);
                  emitChange(finalS, finalE);
                  setOpen(false);
                }
              }}
              aria-invalid={status === 'error' ? true : undefined}
              className={`${inputBase} ${inputSize['md']} ${status ? inputStatus[status] : ''} text-left pr-10 ${(active === 'end' && open) ? 'ring-2 ring-primary/20 border-transparent' : ''} ${(open ? !draftEndInput : !ev) ? 'text-gray-400' : 'text-gray-700'}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
          </div>
        </div>

        {mountNode && createPortal(
          <div
            id="daterange-pop"
            ref={pop}
            role="dialog"
            aria-modal={open ? true : undefined}
            aria-hidden={!open}
            className={`fixed z-[1200] w-[560px] rounded-lg border border-gray-200 bg-white p-2 shadow-elevation-1
                transition-opacity duration-150
                ${open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
            style={{ top: pos.top, left: pos.left } as CSSProperties}
          >

            <div className="flex gap-2 outline-none focus:outline-none" tabIndex={0} onKeyDown={(e) => {
              const base = focusDate || (active === 'start' ? (draftStart || left) : (draftEnd || right) || new Date());
              const stepDays = (d: Date, n: number) => { const t = new Date(d); t.setDate(t.getDate() + n); return t; };
              const ensureVisible = (next: Date) => {
                const nm = startOfMonth(next);
                if (active === 'start') {
                  const leftStart = startOfMonth(left);
                  const rightEnd = endOfMonth(right);
                  if (next < leftStart || next > rightEnd) { setLeft(nm); }
                } else {
                  const leftStart = startOfMonth(left);
                  const rightEnd = endOfMonth(right);
                  if (next < leftStart || next > rightEnd) { setRight(nm); }
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
                defaultMonth={left}
                focusDate={active === 'start' ? focusDate : undefined}
                rangeStart={draftStart}
                rangeEnd={draftEnd}
                min={minD}
                max={maxD}
                disabledDate={isDisabledStartPick}
                hoverDate={hoverDate}
                onHoverDate={setHoverDate}
                onVisibleMonthChange={(m) => {
                  // 月/年变更：若有开始日期草稿，尽量保留“日”，并避开禁用规则；同时更新输入草稿
                  setLeft(m);
                  setActive('start');
                  setFocused('start');
                  if (draftStart) {
                    const y = m.getFullYear();
                    const mon = m.getMonth();
                    const baseDay = draftStart.getDate();
                    const lastDay = new Date(y, mon + 1, 0).getDate();
                    const tryDay = (day: number) => new Date(y, mon, day);
                    const minDay = Math.min(baseDay, lastDay);
                    let nd: Date | undefined = tryDay(minDay);
                    const invalid = (d: Date) => isDisabledStartPick(d);
                    if (nd && invalid(nd)) {
                      nd = undefined;
                      for (let offset = 1; offset <= lastDay; offset++) {
                        const down = baseDay - offset;
                        const up = baseDay + offset;
                        if (down >= 1) {
                          const cand = tryDay(down);
                          if (!invalid(cand)) { nd = cand; break; }
                        }
                        if (up <= lastDay) {
                          const cand = tryDay(up);
                          if (!invalid(cand)) { nd = cand; break; }
                        }
                      }
                    }
                    if (nd) { setDraftStart(nd); setDraftStartInput(formatISO(nd)); }
                  }
                }}
                onSelect={selectStart}
                panel={'start'}
              />
              <Calendar
                defaultMonth={right}
                focusDate={active === 'end' ? focusDate : undefined}
                rangeStart={draftStart}
                rangeEnd={draftEnd}
                min={minD}
                max={maxD}
                disabledDate={isDisabledEndPick}
                hoverDate={hoverDate}
                onHoverDate={setHoverDate}
                onVisibleMonthChange={(m) => {
                  // 月/年变更：若有结束日期草稿，尽量保留“日”，并避开禁用规则；同时更新输入草稿
                  setRight(m);
                  setActive('end');
                  setFocused('end');
                  if (draftEnd) {
                    const y = m.getFullYear();
                    const mon = m.getMonth();
                    const baseDay = draftEnd.getDate();
                    const lastDay = new Date(y, mon + 1, 0).getDate();
                    const tryDay = (day: number) => new Date(y, mon, day);
                    const minDay = Math.min(baseDay, lastDay);
                    let nd: Date | undefined = tryDay(minDay);
                    const invalid = (d: Date) => isDisabledEndPick(d);
                    if (nd && invalid(nd)) {
                      nd = undefined;
                      for (let offset = 1; offset <= lastDay; offset++) {
                        const down = baseDay - offset;
                        const up = baseDay + offset;
                        if (down >= 1) {
                          const cand = tryDay(down);
                          if (!invalid(cand)) { nd = cand; break; }
                        }
                        if (up <= lastDay) {
                          const cand = tryDay(up);
                          if (!invalid(cand)) { nd = cand; break; }
                        }
                      }
                    }
                    if (nd) { setDraftEnd(nd); setDraftEndInput(formatISO(nd)); }
                  }
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
                    const leftM = startOfMonth(day); setLeft(leftM);
                  } else if (focused === 'end') {
                    if (isDisabledEndPick(day)) return;
                    setDraftEnd(day); setDraftEndInput(formatISO(day));
                    const rightM = startOfMonth(day); setRight(rightM);
                  } else {
                    if (active === 'end') {
                      if (isDisabledEndPick(day)) return;
                      setDraftEnd(day); setDraftEndInput(formatISO(day));
                      const rightM = startOfMonth(day); setRight(rightM);
                    } else {
                      if (isDisabledStartPick(day)) return;
                      setDraftStart(day); setDraftStartInput(formatISO(day));
                      const leftM = startOfMonth(day); setLeft(leftM);
                    }
                  }
                }}>今天</button>
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canPickYesterday} onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() - 1); const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  if (focused === 'start') {
                    if (isDisabledStartPick(day)) return;
                    setDraftStart(day); setDraftStartInput(formatISO(day));
                    const leftM = startOfMonth(day); setLeft(leftM);
                  } else if (focused === 'end') {
                    if (isDisabledEndPick(day)) return;
                    setDraftEnd(day); setDraftEndInput(formatISO(day));
                    const rightM = startOfMonth(day); setRight(rightM);
                  } else {
                    if (active === 'end') {
                      if (isDisabledEndPick(day)) return;
                      setDraftEnd(day); setDraftEndInput(formatISO(day));
                      const rightM = startOfMonth(day); setRight(rightM);
                    } else {
                      if (isDisabledStartPick(day)) return;
                      setDraftStart(day); setDraftStartInput(formatISO(day));
                      const leftM = startOfMonth(day); setLeft(leftM);
                    }
                  }
                }}>昨天</button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="h-8 rounded-md border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50" onClick={doClear}>清除</button>
              </div>
            </div>
          </div>, mountNode)
        }
      </div>
  );
}
