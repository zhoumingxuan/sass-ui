"use client";

import { useEffect, useRef, useState } from 'react';
import { fieldLabel, helperText, inputBase } from '../formStyles';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import Calendar from './Calendar';
import { formatISO, parseISO } from './utils';

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
};

export default function DatePicker({ label, helper, value, defaultValue, min, max, disabledDate, clearable = true, onChange, className = '' }: Props) {
  const isControlled = typeof value !== 'undefined';
  const [internal, setInternal] = useState<string | undefined>(defaultValue);
  const v = (isControlled ? value : internal) as string | undefined;
  const date = parseISO(v);

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => date ?? new Date());
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

  const commit = (val?: string) => { if (!isControlled) setInternal(val); onChange?.(val); };
  const clear = () => commit(undefined);

  useEffect(() => {
    if (date) setMonth(date);
  }, [date]);

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div ref={anchor} className={`relative ${className}`}>
        <button type="button" onClick={() => setOpen((o) => !o)} className={`${inputBase} text-left pr-10 leading-none flex items-center h-10 ${!v ? 'text-gray-400' : ''}`}>{v ?? '请选择日期'}</button>
        {clearable && v && (
          <button type="button" onClick={clear} aria-label="清空" className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
            <X size={16} aria-hidden />
          </button>
        )}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarIcon size={18} aria-hidden /></span>
        {open && (
          <div ref={pop} className="absolute z-20 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-elevation-1">
            <Calendar
              month={month}
              value={date}
              min={parseISO(min)}
              max={parseISO(max)}
              disabledDate={disabledDate}
              onSelect={(d) => { commit(formatISO(d)); setOpen(false); }}
              onMonthChange={(m) => setMonth(m)}
            />
            <div className="mt-2 flex items-center justify-between px-1">
              <div className="text-[11px] text-gray-400">可选择年份、月份、日期</div>
              <div className="flex gap-2">
                <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => { const d = new Date(); setMonth(d); commit(formatISO(d)); setOpen(false); }}>今天</button>
                {clearable && <button type="button" className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => { clear(); }}>清空</button>}
              </div>
            </div>
          </div>
        )}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
