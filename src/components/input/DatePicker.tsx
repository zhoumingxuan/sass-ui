"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { inputBase, inputStatus, Status, inputSize } from "../formStyles";
import { X, Calendar as CalendarIcon } from "lucide-react";
import Calendar from "./Calendar";
import { formatISO, parseISO } from "./utils";
import type { FormValueProps } from "../formTypes";

type Props = FormValueProps<string | undefined> & {
  min?: string;
  max?: string;
  disabledDate?: (d: Date) => boolean;
  clearable?: boolean;
  className?: string;
  status?: Status;
};

export default function DatePicker({ value, defaultValue, min, max, disabledDate, clearable = true, onChange, className = '', status }: Props) {

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(parseISO(defaultValue));
  const pop = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const [mountNode, setMountNode] = useState<Element | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (typeof value !== 'undefined' && value !== '') {
      setDate(parseISO(value));
    }
  }, [value]);

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
    onChange?.(next);
    setDate(parseISO(next));
  };
  const clear = () => commit(undefined);

  const minDate = parseISO(min);
  const maxDate = parseISO(max);
  const fallbackValueDate = parseISO(value);
  const fallbackDefaultDate = parseISO(defaultValue);
  const calendarDefaultMonth = date ?? fallbackValueDate ?? fallbackDefaultDate ?? new Date();
  const inputValue = formatISO(date);
  const hasValue = inputValue !== '';

  return (
    <div ref={anchor} className={`relative ${className}`}>
      <input
        type="text"
        placeholder="请选择日期"
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        value={inputValue}
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
        className={[inputBase, inputSize['md'], status ? inputStatus[status] : '', 'text-left pr-10', hasValue ? 'text-gray-700' : 'text-gray-400'].filter(Boolean).join(' ')}
      />
      {clearable && hasValue && (
        <button type="button" onClick={clear} aria-label="清空" className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
          <X size={16} aria-hidden />
        </button>
      )}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
      {open && mountNode && createPortal(
        <div ref={pop} className="fixed z-[1200] rounded-lg border border-gray-200 bg-white p-2 shadow-elevation-1" style={{ top: pos.top, left: pos.left, minWidth: pos.width } as CSSProperties}>
          <Calendar
            value={date}
            defaultMonth={calendarDefaultMonth}
            min={minDate}
            max={maxDate}
            disabledDate={disabledDate}
            onSelect={(d) => { commit(formatISO(d)); setOpen(false); }}
          />
          <div className="mt-2 flex items-center justify-between px-1">
            <div className="text-[11px] text-gray-400">可选择年份、月份、日期</div>
            <div className="flex gap-2">
              <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => { const d = new Date(); setDate(d); commit(formatISO(d)); setOpen(false); }}>今天</button>
              {clearable && <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => { clear(); }}>清空</button>}
            </div>
          </div>
        </div>, mountNode)
      }
    </div>
  );
}
