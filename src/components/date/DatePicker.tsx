"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import { fieldLabel, helperText, inputBase, inputStatus, Status } from '../formStyles';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import Calendar from './Calendar';
import { addMonths, formatISO, parseISO } from './utils';

type Props = {
  label?: string;
  helper?: string;
  value?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  disabledDate?: (d: Date) => boolean;
  clearable?: boolean;
  onChange?: (v?: string) => void;
  className?: string;
  status?: Status;
};

export default function DatePicker({ label, helper, value, defaultValue, min, max, disabledDate, clearable = true, onChange, className = '', status }: Props) {
  const isControlled = typeof value !== 'undefined';
  const [internal, setInternal] = useState<string | undefined>(defaultValue);
  const v = (isControlled ? value : internal) as string | undefined;
  const date = useMemo(() => parseISO(v), [v]);

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => date ?? new Date());
  const pop = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const [mountNode, setMountNode] = useState<Element | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!pop.current || !anchor.current) return;
      if (pop.current.contains(e.target as Node) || anchor.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => { if (typeof document !== 'undefined') setMountNode(document.getElementById('layout-body') || document.body); }, []);
  useEffect(() => {
    const update = () => {
      const el = anchor.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const top = r.bottom + 4 + window.scrollY;
      const left = r.left + window.scrollX;
      setPos({ top, left, width: r.width });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [open]);

  const commit = (val?: string) => {
    let next = val;
    if (val) {
      const d = parseISO(val)!;
      const minD = parseISO(min);
      const maxD = parseISO(max);
      const isInvalid = (x: Date) => (minD && x < minD) || (maxD && x > maxD) || !!disabledDate?.(x);
      if (isInvalid(d)) {
        let found: Date | undefined;
        for (let i = 1; i <= 366; i++) {
          const down = new Date(d); down.setDate(d.getDate() - i);
          if (!isInvalid(down)) { found = down; break; }
          const up = new Date(d); up.setDate(d.getDate() + i);
          if (!isInvalid(up)) { found = up; break; }
        }
        next = found ? formatISO(found) : undefined;
      }
    }
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };
  const clear = () => commit(undefined);

  useEffect(() => {
    if (date) setMonth(date);
  }, [date]);

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div ref={anchor} className={`relative ${className}`}>
        <input
          type="text"
          placeholder="请选择日期"
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            const applyMonth = (m: Date) => {
              setMonth(m);
              const y = m.getFullYear();
              const mon = m.getMonth();
              const baseDay = date?.getDate() ?? 1;
              const lastDay = new Date(y, mon + 1, 0).getDate();
              const nd = new Date(y, mon, Math.min(baseDay, lastDay));
              commit(formatISO(nd));
            };
            if (e.key === 'ArrowDown') { setOpen(true); e.preventDefault(); }
            if (e.key === 'Escape' && open) { setOpen(false); e.preventDefault(); }
            if (e.key === 'PageUp') { applyMonth(addMonths(month, e.shiftKey ? -12 : -1)); setOpen(true); e.preventDefault(); }
            if (e.key === 'PageDown') { applyMonth(addMonths(month, e.shiftKey ? 12 : 1)); setOpen(true); e.preventDefault(); }
          }}
          value={v ?? ''}
          onChange={(e) => {
            const raw = e.target.value.trim();
            if (raw === '') { commit(undefined); return; }
            // accept yyyy-mm-dd
            if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
              const d = parseISO(raw)!;
              const minD = parseISO(min);
              const maxD = parseISO(max);
              const invalid = (minD && d < minD) || (maxD && d > maxD) || !!disabledDate?.(d);
              if (!invalid) commit(raw);
            }
          }}
          aria-invalid={status === 'error' ? true : undefined}
          className={[inputBase, status ? inputStatus[status] : '', 'text-left pr-10 leading-none flex items-center h-10', !v ? 'text-gray-400' : 'text-gray-700'].filter(Boolean).join(' ')}
        />
        {clearable && v && (
          <button type="button" onClick={clear} aria-label="清空" className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
            <X size={16} aria-hidden />
          </button>
        )}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
        {open && mountNode && createPortal(
          <div ref={pop} className="fixed z-[1200] rounded-lg border border-gray-200 bg-white p-2 shadow-elevation-1" style={{ top: pos.top, left: pos.left, minWidth: pos.width } as CSSProperties}>
            <Calendar
              month={month}
              value={date}
              min={parseISO(min)}
              max={parseISO(max)}
              disabledDate={disabledDate}
              onSelect={(d) => { commit(formatISO(d)); setOpen(false); }}
              onMonthChange={(m) => {
                setMonth(m);
                const y = m.getFullYear();
                const mon = m.getMonth();
                const baseDay = date?.getDate() ?? 1;
                const lastDay = new Date(y, mon + 1, 0).getDate();
                const tryDay = (day: number) => new Date(y, mon, day);
                const minD = parseISO(min);
                const maxD = parseISO(max);
                const isInvalid = (d: Date) => (minD && d < minD) || (maxD && d > maxD) || !!disabledDate?.(d);
                let nd: Date | undefined = tryDay(Math.min(baseDay, lastDay));
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
                if (nd) commit(formatISO(nd));
              }}
            />
            <div className="mt-2 flex items-center justify-between px-1">
              <div className="text-[11px] text-gray-400">可选择年份、月份、日期</div>
              <div className="flex gap-2">
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => { const d = new Date(); setMonth(d); commit(formatISO(d)); setOpen(false); }}>今天</button>
                {clearable && <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => { clear(); }}>清空</button>}
              </div>
            </div>
          </div>, mountNode)
        }
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
