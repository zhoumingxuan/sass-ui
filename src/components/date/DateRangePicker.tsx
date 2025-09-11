"use client";

/**
 * 日期区间选择器（DateRangePicker）
 * - 周一起始；中文文案；本地解析（不做自动更正）
 * - 顶部快捷：今天｜昨天｜最近7天｜（可选）本月
 * - 中部：双月日历（左当月、右次月），禁用置灰并提示原因
 * - 可选：含时间开关（默认关），开启后提供开始/结束的 时:分 选择
 * - 底部：清除｜取消｜确定（需确认时显示）
 * - 校验：格式、顺序、跨度≤365天（默认）、边界、禁用、闰年
 * - 键盘：方向键移动；Enter 选中/确定；Esc 关闭；Tab 切换
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { fieldLabel, helperText, inputBase } from '../formStyles';
import { Calendar as CalendarIcon } from 'lucide-react';
import Calendar from './Calendar';
import {
  addMonths,
  endOfMonth,
  formatDateTime,
  formatISO,
  parseDateStrict,
  parseDateTimeStrict,
  startOfMonth,
  spanDaysInclusive,
} from './utils';

type DisabledRange = { start: string | Date; end: string | Date; reason?: string };

type Props = {
  label?: string;
  helper?: string;
  start?: string; // YYYY-MM-DD 或 YYYY-MM-DD HH:mm
  end?: string;   // YYYY-MM-DD 或 YYYY-MM-DD HH:mm
  defaultStart?: string;
  defaultEnd?: string;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  // 旧：回调禁用（保留）
  disabledDate?: (d: Date) => boolean;
  // 新：黑名单能力
  disabledDates?: Array<string | Date>;
  disabledRanges?: DisabledRange[];
  disabledWeekdays?: number[]; // 0..6，周日=0
  disabledBefore?: string | Date;
  disabledAfter?: string | Date;
  // 交互 & 校验
  requireConfirm?: boolean; // 默认 true：显示底部操作
  shortcutRequireConfirm?: boolean; // 默认跟随 requireConfirm
  showThisMonthShortcut?: boolean; // 默认 true
  maxSpanDays?: number; // 默认 365（日期模式）
  // 含时间
  enableTime?: boolean; // 显示“含时间”开关
  defaultTimeOn?: boolean; // 默认 false
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
  maxSpanDays = 365,
  enableTime = false,
  defaultTimeOn = false,
  onChange,
  className = '',
}: Props) {
  // 受控/非受控
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

  // 含时间
  const [timeOn, setTimeOn] = useState<boolean>(!!defaultTimeOn);
  const [startTime, setStartTime] = useState<string | undefined>(undefined); // HH:mm
  const [endTime, setEndTime] = useState<string | undefined>(undefined); // HH:mm

  // 草稿（不影响已提交值）
  const [draftStart, setDraftStart] = useState<Date | undefined>(undefined);
  const [draftEnd, setDraftEnd] = useState<Date | undefined>(undefined);
  const [draftStartInput, setDraftStartInput] = useState<string>('');
  const [draftEndInput, setDraftEndInput] = useState<string>('');
  const [error, setError] = useState<string | undefined>(undefined);

  const shortcutsNeedConfirm = typeof shortcutRequireConfirm === 'boolean' ? shortcutRequireConfirm : requireConfirm;

  // 点击外部关闭（不改当前值）
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

  // 打开面板，初始化草稿
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
    setError(undefined);
    setOpen(true);
  };

  // 黑名单/禁用合成
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
  const isDisabledDate = (d: Date) => {
    if (disabledDate?.(d)) return true;
    if (isOutOfBound(d)) return true;
    if (weekdayDisabled(d)) return true;
    if (disabledDatesSet.has(formatISO(d))) return true;
    if (inDisabledRanges(d)) return true;
    return false;
  };
  const disabledReason = (d: Date): string | undefined => {
    if (disabledDate?.(d)) return '该日期不可选';
    if (isOutOfBound(d)) {
      if (minD && d < minD) return '早于最小日期';
      if (maxD && d > maxD) return '晚于最大日期';
      if (disabledBeforeDate && d < disabledBeforeDate) return '不可选';
      if (disabledAfterDate && d > disabledAfterDate) return '不可选';
    }
    if (weekdayDisabled(d)) return '不可选';
    if (disabledDatesSet.has(formatISO(d))) return '不可选';
    const r = inDisabledRanges(d); if (r) return r.reason || '不可选';
    return undefined;
  };

  // 严格校验（不做自动更正）
  const validate = (): string | undefined => {
    const ps = draftStartInput.trim();
    const pe = draftEndInput.trim();
    const sd = ps ? parseDateTimeStrict(ps) : undefined;
    const ed = pe ? parseDateTimeStrict(pe) : undefined;
    const sDateOnly = sd?.date; const eDateOnly = ed?.date;
    const sHasTime = !!sd?.hasTime; const eHasTime = !!ed?.hasTime;

    if (ps && !sd) return '请输入合法日期，如 2025-09-11';
    if (pe && !ed) return '请输入合法日期，如 2025-09-11';

    let sFull = sDateOnly ? new Date(sDateOnly) : undefined;
    let eFull = eDateOnly ? new Date(eDateOnly) : undefined;
    if (timeOn) {
      if (sFull) {
        const t = sHasTime ? toHHmm(sd!.date) : (startTime || undefined);
        if (!t) return '请选择开始时间';
        const [hh, mm] = t.split(':').map(Number); sFull.setHours(hh, mm, 0, 0);
      }
      if (eFull) {
        const t = eHasTime ? toHHmm(ed!.date) : (endTime || undefined);
        if (!t) return '请选择结束时间';
        const [hh, mm] = t.split(':').map(Number); eFull.setHours(hh, mm, 0, 0);
      }
    }

    if (sFull && isDisabledDate(sFull)) return disabledReason(sFull) || '该日期不可选';
    if (eFull && isDisabledDate(eFull)) return disabledReason(eFull) || '该日期不可选';

    if (sFull && eFull) {
      if (!timeOn) {
        if (eFull < sFull) return '结束日期不能早于开始日期';
      } else {
        if (eFull <= sFull) return '结束时间需晚于开始时间';
      }
      const days = spanDaysInclusive(sFull, eFull);
      if (days > maxSpanDays) return `跨度不能超过 ${maxSpanDays} 天`;
    }
    return undefined;
  };

  const doConfirm = () => {
    const err = validate(); setError(err); if (err) return;
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

  // 面板选中（只改草稿）
  const select = (d: Date) => {
    if (isDisabledDate(d)) { setError(disabledReason(d)); return; }
    const pick = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (active === 'start') {
      setDraftStart(pick);
      setDraftStartInput(formatISO(pick));
      setActive('end');
    } else if (active === 'end') {
      setDraftEnd(pick);
      setDraftEndInput(formatISO(pick));
    } else {
      if (!draftStart || (draftStart && draftEnd)) {
        setDraftStart(pick); setDraftStartInput(formatISO(pick)); setDraftEnd(undefined); setDraftEndInput(''); setActive('end');
      } else {
        setDraftEnd(pick); setDraftEndInput(formatISO(pick));
      }
    }
    setError(validate());
  };

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div ref={anchor} className={`relative ${className}`}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* 左：开始 */}
          <div className="relative">
            <input
              type="text"
              placeholder={'开始日期'}
              value={open ? draftStartInput : (sv ?? '')}
              onFocus={() => openPanel('start')}
              onClick={() => openPanel('start')}
              onChange={(e) => { setDraftStartInput(e.target.value); setError(undefined); }}
              onBlur={() => { setError(validate()); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { const v = validate(); setError(v); if (!requireConfirm && !v) doConfirm(); }}}
              className={`${inputBase} text-left pr-10 leading-none flex items-center h-10 ${active === 'start' ? 'ring-2 ring-primary/60 border-transparent' : ''} ${(open ? !draftStartInput : !sv) ? 'text-gray-400' : 'text-gray-700'} ${error ? 'border-red-400' : ''}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
          </div>
          <span className="text-xs text-gray-500">至</span>
          {/* 右：结束 */}
          <div className="relative">
            <input
              type="text"
              placeholder={'结束日期'}
              value={open ? draftEndInput : (ev ?? '')}
              onFocus={() => openPanel('end')}
              onClick={() => openPanel('end')}
              onChange={(e) => { setDraftEndInput(e.target.value); setError(undefined); }}
              onBlur={() => { setError(validate()); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { const v = validate(); setError(v); if (!requireConfirm && !v) doConfirm(); }}}
              className={`${inputBase} text-left pr-10 leading-none flex items-center h-10 ${active === 'end' ? 'ring-2 ring-primary/60 border-transparent' : ''} ${(open ? !draftEndInput : !ev) ? 'text-gray-400' : 'text-gray-700'} ${error ? 'border-red-400' : ''}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
          </div>
        </div>

        {open && (
          <div ref={pop} className="absolute z-20 mt-1 w-[560px] rounded-lg border border-gray-200 bg-white p-2 shadow-elevation-1">
            {/* 顶部：快捷 + 时间开关 */}
            <div className="flex items-center justify-between px-1 pb-2">
              <div className="flex gap-2">
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => {
                  const d = new Date(); const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  setDraftStart(day); setDraftEnd(day); setDraftStartInput(formatISO(day)); setDraftEndInput(formatISO(day));
                  if (!shortcutsNeedConfirm) { doConfirm(); } else { setError(validate()); }
                }}>今天</button>
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() - 1); const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  setDraftStart(day); setDraftEnd(day); setDraftStartInput(formatISO(day)); setDraftEndInput(formatISO(day));
                  if (!shortcutsNeedConfirm) { doConfirm(); } else { setError(validate()); }
                }}>昨天</button>
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => {
                  const endD = new Date(); const e0 = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate());
                  const s0 = new Date(e0); s0.setDate(e0.getDate() - 6);
                  setDraftStart(s0); setDraftEnd(e0); setDraftStartInput(formatISO(s0)); setDraftEndInput(formatISO(e0));
                  if (!shortcutsNeedConfirm) { doConfirm(); } else { setError(validate()); }
                }}>最近7天</button>
                {showThisMonthShortcut && (
                  <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => {
                    const now = new Date(); const ms = new Date(now.getFullYear(), now.getMonth(), 1); const me = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    setDraftStart(ms); setDraftEnd(me); setDraftStartInput(formatISO(ms)); setDraftEndInput(formatISO(me));
                    if (!shortcutsNeedConfirm) { doConfirm(); } else { setError(validate()); }
                  }}>本月</button>
                )}
              </div>
              {enableTime && (
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input type="checkbox" checked={timeOn} onChange={(e) => { setTimeOn(e.target.checked); setError(undefined); }} /> 含时间
                </label>
              )}
            </div>

            {/* 键盘最小集：方向键、Enter、Esc */}
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
                // 跳过禁用
                let guard = 0;
                while (isDisabledDate(next) && guard < 31) { next = stepDays(next, n > 0 ? 1 : -1); guard++; }
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
                disabledDate={isDisabledDate}
                disabledReason={disabledReason}
                hoverDate={hoverDate}
                onHoverDate={setHoverDate}
                onMonthChange={(m) => { setLeft(m); }}
                onSelect={select}
              />
              <Calendar
                month={right}
                rangeStart={draftStart}
                rangeEnd={draftEnd}
                min={minD}
                max={maxD}
                disabledDate={isDisabledDate}
                disabledReason={disabledReason}
                hoverDate={hoverDate}
                onHoverDate={setHoverDate}
                onMonthChange={(m) => { setRight(m); }}
                onSelect={select}
              />
            </div>

            {/* 时间选择（可选）*/}
            {enableTime && timeOn && (
              <div className="mb-2 grid grid-cols-2 gap-2 px-1">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-10 text-right text-gray-500">开始</span>
                  <select className="h-8 rounded border border-gray-200 px-1" value={startTime || ''} onChange={(e) => { setStartTime(e.target.value); setError(undefined); }}>
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
                  <select className="h-8 rounded border border-gray-200 px-1" value={endTime || ''} onChange={(e) => { setEndTime(e.target.value); setError(undefined); }}>
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

            {/* 已选择天数（仅日期模式）*/}
            {!timeOn && draftStart && draftEnd && (
              <div className="px-1 pb-2 text-[11px] text-gray-500">已选择 {spanDaysInclusive(draftStart, draftEnd)} 天</div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="px-1 pb-2 text-[12px] text-red-500">{error}</div>
            )}

            {/* 底部操作 */}
            {requireConfirm && (
              <div className="flex items-center justify-end gap-2 px-1 pt-1">
                <button type="button" className="h-8 rounded-md border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50" onClick={doClear}>清除</button>
                <button type="button" className="h-8 rounded-md border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>取消</button>
                <button type="button" disabled={!!validate()} className={`h-8 rounded-md px-3 text-sm text-white ${validate() ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`} onClick={doConfirm}>确定</button>
              </div>
            )}
          </div>
        )}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
