'use client';

import { createRoot, Root } from 'react-dom/client';
import { ReactNode, useEffect, useMemo, useState } from 'react';

type Type = 'info' | 'success' | 'warning' | 'error' | 'loading';

type Msg = { id: number; type: Type; content: ReactNode; duration: number };

let holderRoot: Root | null = null;
let apiRef: { add: (m: Omit<Msg, 'id'>) => () => void; clear: () => void } | null = null;
let uid = 1;

function MessageHolder() {
  const [list, setList] = useState<Msg[]>([]);

  useEffect(() => {
    apiRef = {
      add(m) {
        const id = uid++;
        setList((arr) => [...arr, { id, ...m }]);
        const timer = setTimeout(() => {
          setList((arr) => arr.filter((x) => x.id !== id));
        }, m.duration);
        return () => {
          clearTimeout(timer);
          setList((arr) => arr.filter((x) => x.id !== id));
        };
      },
      clear() {
        setList([]);
      },
    };
  }, []);

  const typeStyles: Record<Type, string> = useMemo(
    () => ({
      info: 'bg-info text-white',
      success: 'bg-success text-white',
      warning: 'bg-warning text-white',
      error: 'bg-error text-white',
      loading: 'bg-gray-700 text-white',
    }),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-2">
      {list.map((m) => (
        <div
          key={m.id}
          className={`pointer-events-auto min-w-message max-w-message rounded-md px-4 py-2 shadow-lg ${typeStyles[m.type]}`}
          role="status"
        >
          <div className="text-sm">{m.content}</div>
        </div>
      ))}
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

function show(type: Type, content: ReactNode, duration = 2000) {
  ensureHolder();
  if (!apiRef) return () => {};
  return apiRef.add({ type, content, duration });
}

const message = {
  info: (c: ReactNode, d?: number) => show('info', c, d),
  success: (c: ReactNode, d?: number) => show('success', c, d),
  warning: (c: ReactNode, d?: number) => show('warning', c, d),
  error: (c: ReactNode, d?: number) => show('error', c, d),
  loading: (c: ReactNode, d?: number) => show('loading', c, d ?? 0),
  destroy: () => apiRef?.clear(),
};

export default message;
