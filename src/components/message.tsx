'use client';

import { createRoot, Root } from 'react-dom/client';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle, Loader2, X as Close } from 'lucide-react';

type Type = 'info' | 'success' | 'warning' | 'error' | 'loading';
type Placement = 'top-center' | 'top-right' | 'top-left';

type Msg = { id: number; type: Type; content: ReactNode; duration?: number; showClose?: boolean };
type Config = { placement?: Placement; duration?: number };

let holderRoot: Root | null = null;
let apiRef: { add: (m: Omit<Msg, 'id'>) => () => void; clear: () => void; setConfig: (c: Config) => void } | null = null;
let uid = 1;

function MessageHolder() {
  const [list, setList] = useState<Msg[]>([]);
  const [placement, setPlacement] = useState<Placement>('top-center');
  const [defaultDuration, setDefaultDuration] = useState<number>(3000);

  useEffect(() => {
    apiRef = {
      add(m) {
        const id = uid++;
        const item = { id, showClose: false, ...m } as Msg;
        setList((arr) => [...arr, item]);
        const useDuration = m.duration ?? defaultDuration;
        const timer = useDuration > 0 ? window.setTimeout(() => {
          setList((arr) => arr.filter((x) => x.id !== id));
        }, useDuration) : undefined;
        return () => {
          if (timer) clearTimeout(timer);
          setList((arr) => arr.filter((x) => x.id !== id));
        };
      },
      clear() {
        setList([]);
      },
      setConfig(c) {
        if (c.placement) setPlacement(c.placement);
        if (typeof c.duration === 'number') setDefaultDuration(c.duration);
      },
    };
  }, [defaultDuration]);

  const meta = useMemo(() => ({
    info:    { icon: Info,          iconColor: 'text-info',    iconBg: 'bg-info/10',    iconRing: 'ring-info/20' },
    success: { icon: CheckCircle2,  iconColor: 'text-success', iconBg: 'bg-success/10', iconRing: 'ring-success/20' },
    warning: { icon: AlertTriangle, iconColor: 'text-warning', iconBg: 'bg-warning/10', iconRing: 'ring-warning/20' },
    error:   { icon: XCircle,       iconColor: 'text-error',   iconBg: 'bg-error/10',   iconRing: 'ring-error/20' },
    loading: { icon: Loader2,       iconColor: 'text-gray-500',iconBg: 'bg-gray-200/60',iconRing: 'ring-gray-300/40' },
  }), []);

  const containerClass = placement === 'top-center'
    ? 'inset-x-0 top-6 items-center'
    : placement === 'top-left'
    ? 'top-6 left-6 items-start'
    : 'top-6 right-6 items-end';

  return (
    <div className={`pointer-events-none fixed z-[9999] flex flex-col gap-3 ${containerClass}`}>
      {list.map((m) => {
        const Icon = meta[m.type].icon;
        return (
          <div
            key={m.id}
            onClick={() => setList((arr) => arr.filter((x) => x.id !== m.id))}
            className="pointer-events-auto relative min-w-72 max-w-xl rounded-lg bg-white/98 backdrop-blur-[2px] border border-gray-200 shadow-elevation-3 px-4 py-3 transition-transform hover:translate-y-[-1px]"
            role="status" aria-live="polite"
          >
            <div className={`flex items-center gap-3 ${m.showClose ? 'pr-8' : ''}`}> 
              <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full`}>
                <Icon className={`h-4 w-4 ${meta[m.type].iconColor} ${m.type==='loading' ? 'animate-spin' : ''}`} aria-hidden />
              </span>
              <div className="flex-1 text-sm text-gray-800 whitespace-pre-line break-words leading-6">
                {m.content}
              </div>
            </div>
            {m.showClose && (
              <button
                aria-label="关闭"
                onClick={(e) => { e.stopPropagation(); setList((arr) => arr.filter((x) => x.id !== m.id)); }}
                className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded text-gray-400"
              >
                <Close className="h-4 w-4 text-gray-500" strokeWidth={2} aria-hidden />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ensureHolder() {
  if (typeof window === 'undefined') return;
  if (holderRoot) return;
  const div = document.createElement('div');
  document.body.appendChild(div);
  holderRoot = createRoot(div);
  holderRoot.render(<MessageHolder />);
}

type ShowOptions = { duration?: number; showClose?: boolean };

function show(type: Type, content: ReactNode, durationOrOptions?: number | ShowOptions) {
  ensureHolder();
  if (!apiRef) return () => {};
  let duration: number | undefined;
  let showClose: boolean | undefined;
  if (typeof durationOrOptions === 'number') {
    duration = durationOrOptions;
  } else if (durationOrOptions && typeof durationOrOptions === 'object') {
    duration = durationOrOptions.duration;
    showClose = durationOrOptions.showClose;
  }
  return apiRef.add({ type, content, duration, showClose });
}

const message = {
  info: (c: ReactNode, d?: number | ShowOptions) => show('info', c, d),
  success: (c: ReactNode, d?: number | ShowOptions) => show('success', c, d),
  warning: (c: ReactNode, d?: number | ShowOptions) => show('warning', c, d),
  error: (c: ReactNode, d?: number | ShowOptions) => show('error', c, d),
  loading: (c: ReactNode, d?: number | ShowOptions) => show('loading', c, typeof d === 'number' || !d ? d ?? 0 : { duration: d.duration ?? 0, showClose: d.showClose }),
  destroy: () => apiRef?.clear(),
  config: (c: Config) => {
    // Holder may not exist yet; cache via ensure then set
    ensureHolder();
    if (apiRef) apiRef.setConfig(c);
  },
};

export default message;
