"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { inputBase, fieldLabel, helperText, inputStatus, Status, InputSize, inputSize } from "../formStyles";
import { X, Check, ChevronDown } from "lucide-react";
import Pill from "@/components/Pill";

export type Option = { value: string; label: string; disabled?: boolean };

type BaseProps = {
  label?: string;
  helper?: string;
  options: Option[];
  placeholder?: string;
  clearable?: boolean;
  required?: boolean;
  className?: string;
  status?: Status;
  size?: InputSize; // lg | md | sm
};

type SingleProps = BaseProps & {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

type MultiProps = BaseProps & {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
};

type Props = SingleProps | MultiProps;

export default function Select(props: Props) {
  const {
    label,
    helper,
    options,
    placeholder,
    clearable,
    className = "",
    required,
    status,
    size = 'md',
  } = props;
  const multiple = (props as MultiProps).multiple === true;
  const controlledValue = (props as any).value as (string | string[] | undefined);
  const defaultValue = (props as any).defaultValue as (string | string[] | undefined);
  const onChange = (props as any).onChange as ((v: string | string[]) => void) | undefined;

  const id = useId();
  const isControlled = typeof controlledValue !== "undefined";
  const [internal, setInternal] = useState<string | string[] | undefined>(defaultValue);
  const val = (isControlled ? controlledValue : internal) as (string | string[] | undefined);
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [mountNode, setMountNode] = useState<Element | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  const canClear = !!clearable && (multiple ? Array.isArray(val) && val.length > 0 : !!val);
  const commitSingle = (v: string) => { if (!isControlled) setInternal(v); onChange?.(v); setOpen(false); };
  const toggleMulti = (v: string) => {
    const curr = Array.isArray(val) ? val : [];
    const next = curr.includes(v) ? curr.filter(x => x !== v) : [...curr, v];
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };
  const handleClear = () => {
    if (multiple) {
      if (!isControlled) setInternal([]);
      onChange?.([]);
    } else {
      if (!isControlled) setInternal("");
      onChange?.("");
    }
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!pop.current || !anchor.current) return;
      if (pop.current.contains(e.target as Node) || anchor.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // mount portal node
  useEffect(() => {
    if (typeof document !== 'undefined') setMountNode(document.getElementById('layout-body') || document.body);
  }, []);

  // position popup on open/resize/scroll
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = anchor.current;
      if (!el) return;
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

  const labelText = !multiple
    ? (typeof val === 'string' && val ? (options.find(o => o.value === val)?.label ?? '') : '')
    : '';
  const itemText = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const textTone = multiple ? ((Array.isArray(val) && val.length > 0) ? 'text-gray-700' : 'text-gray-400') : (val ? 'text-gray-700' : 'text-gray-400');
  const selectedSet = new Set(Array.isArray(val) ? val : (typeof val === 'string' && val ? [val] : []));
  const selectedLabels = options.filter(o => selectedSet.has(o.value)).map(o => o.label);

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <div ref={anchor} className={`relative ${className}`}>
        <button
          type="button"
          id={id}
          onClick={() => setOpen(o => !o)}
          onFocus={(e) => {
            if (e.currentTarget.matches(':focus-visible')) {
              setOpen(true);
            }
          }}
          className={[
            inputBase,
            inputSize[size],
            status ? inputStatus[status] : '',
            'text-left flex items-center',
            textTone,
            size === 'lg' ? 'pr-12' : size === 'sm' ? 'pr-8' : 'pr-10'
          ].filter(Boolean).join(' ')}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={status === 'error' ? true : undefined}
        >
          {!multiple && (labelText || placeholder || '')}
          {multiple && (
            (selectedLabels.length > 0)
              ? <Pill tone="primary" className="max-w-full"><span className="truncate">已选{selectedLabels.length}项</span></Pill>
              : (placeholder || '')
          )}
        </button>
        {canClear && (
          <button type="button" onClick={handleClear} aria-label="清空" className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} aria-hidden />
          </button>
        )}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><ChevronDown size={16} aria-hidden /></span>
        {open && mountNode && createPortal(
          <div
            ref={pop}
            role="listbox"
            className="fixed z-[1200] max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-elevation-1"
            style={{ top: pos.top, left: pos.left, minWidth: pos.width } as CSSProperties}
            aria-multiselectable={multiple || undefined}
          >
            {multiple && selectedLabels.length > 0 && (
              <div className="px-2 pb-2">
                <div className="px-1 pb-1 text-xs text-gray-500">已选（{selectedLabels.length}）</div>
                <div className="flex flex-wrap gap-2">
                  {options.filter(o => selectedSet.has(o.value)).map(o => (
                    <Pill key={o.value} tone="neutral" className="max-w-full">
                      <span title={o.label}>{o.label}</span>
                    </Pill>
                  ))}
                </div>
                <div className="mx-1 my-2 h-px bg-gray-100" />
              </div>
            )}

            {(!multiple && placeholder && !required) && (
              <button type="button" role="option" aria-selected={!val} className={`flex w-full items-center justify-between px-3 py-2 ${itemText} text-gray-500 hover:bg-gray-50`} onClick={() => commitSingle("")}> 
                {placeholder}
              </button>
            )}
            {options.map(o => {
              const selected = selectedSet.has(o.value);
              return (
                <button
                  type="button"
                  key={o.value}
                  role="option"
                  aria-disabled={o.disabled}
                  aria-selected={selected}
                  disabled={o.disabled}
                  className={`flex w-full items-center justify-between px-3 py-2 ${itemText} hover:bg-gray-50 ${o.disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'}`}
                  onClick={() => (multiple ? toggleMulti(o.value) : commitSingle(o.value))}
                >
                  <span>{o.label}</span>
                  {selected && <Check size={16} className="text-primary" aria-hidden />}
                </button>
              );
            })}
          </div>,
          mountNode
        )}
      </div>
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}
