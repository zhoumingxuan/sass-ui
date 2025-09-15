'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode, CSSProperties } from 'react';
import { X } from 'lucide-react';

type Placement = 'right' | 'top';

type DrawerProps = {
  open?: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children?: ReactNode;
  placement?: Placement;
  width?: number | string;
  footer?: ReactNode | null;
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  className?: string;
  wrapperClassName?: string;
  zIndex?: number;
};

export default function Drawer({
  open,
  onClose,
  title,
  children,
  placement = 'right',
  width,
  footer,
  closable = true,
  maskClosable = true,
  keyboard = true,
  className = '',
  wrapperClassName = '',
  zIndex = 1000,
}: DrawerProps) {
  const visible = !!open;
  const headerId = useId();
  const bodyId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mountNode, setMountNode] = useState<Element | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setMountNode(document.getElementById('layout-body'));
    }
  }, []);

  useEffect(() => {
    if (!keyboard || !visible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [keyboard, visible, onClose]);

  const panelStyle = useMemo(() => {
    if (!width) return undefined;
    return { [placement === 'right' ? 'width' : 'height']: typeof width === 'number' ? `${width}px` : width } as CSSProperties;
  }, [width, placement]);

  if (!visible) return null;

  const isHorizontal = placement === 'right';

  const handleMaskClick: React.MouseEventHandler<HTMLDivElement> = () => {
    if (!maskClosable) return;
    onClose?.();
  };

  const overlay = (
    <div
      ref={overlayRef}
      className={`absolute left-0 right-0 bottom-0 top-header flex ${wrapperClassName}`}
      style={{ zIndex }}
      onMouseDown={handleMaskClick}
      aria-hidden={!visible}
    >
      <div className="absolute inset-0 bg-black/20" aria-hidden />
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby={title ? headerId : undefined}
        aria-describedby={bodyId}
        className={[
          'relative bg-white shadow-elevation-3 overflow-hidden flex flex-col',
          isHorizontal ? 'h-full ml-auto' : 'w-full max-h-[70vh]',
          !width && isHorizontal ? 'w-full sm:w-[clamp(20rem,40%,48rem)]' : '',
          className,
        ].join(' ')}
        style={panelStyle}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between gap-2 border-b border-gray-100">
          <div id={headerId} className="min-h-6 text-base font-medium text-gray-900 leading-6">{title}</div>
          {closable && (
            <button
              onClick={onClose}
              aria-label="关闭"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
            >
              <X size={18} aria-hidden />
            </button>
          )}
        </div>
        <div id={bodyId} className={[
          'px-5 py-4 text-sm leading-6 text-gray-700 flex-1 min-h-0 overflow-auto nice-scrollbar'
        ].join(' ')}>
          {children}
        </div>
        {typeof footer !== 'undefined' && (
          <div className="px-5 py-3 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (mountNode) return createPortal(overlay, mountNode);
  return overlay;
}
