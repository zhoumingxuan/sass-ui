'use client';

import { ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import Button from './Button';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

type ModalVariant = 'default' | 'confirm' | 'info' | 'success' | 'warning' | 'danger';
type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

type Props = {
  // Core API
  open?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;

  // Actions / Footer
  footer?: ReactNode | null; // null = hide footer
  onOk?: () => void | Promise<unknown>;
  okText?: string;
  cancelText?: string;
  okButtonProps?: React.ComponentProps<'button'> & { variant?: React.ComponentProps<typeof Button>['variant'] };
  cancelButtonProps?: React.ComponentProps<'button'> & { variant?: React.ComponentProps<typeof Button>['variant'] };
  confirmLoading?: boolean;
  hideCancel?: boolean; // hide cancel button in default footer

  // Behavior
  centered?: boolean; // center vertically (modal only)
  closable?: boolean; // show top-right close
  maskClosable?: boolean; // click backdrop to close
  keyboard?: boolean; // ESC to close

  // Dimensions / Layout
  size?: ModalSize;
  width?: number | string; // custom width overrides size
  zIndex?: number;
  className?: string; // panel extra classes
  wrapperClassName?: string; // overlay wrapper classes
  variant?: ModalVariant; // subtle accent and icon
  // Drawer support
  mode?: 'modal' | 'drawer';
  placement?: 'right' | 'left' | 'top' | 'bottom';
};

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  onOk,
  okText = '确定',
  cancelText = '取消',
  okButtonProps,
  cancelButtonProps,
  confirmLoading: confirmLoadingProp,
  centered = true,
  closable = true,
  maskClosable = true,
  keyboard = true,
  size = 'md',
  width,
  zIndex = 1000,
  className = '',
  wrapperClassName = '',
  variant = 'default',
  hideCancel = false,
  mode = 'modal',
  placement = 'right',
}: Props) {
  const visible = !!open;
  const headerId = useId();
  const bodyId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(!!confirmLoadingProp);

  useEffect(() => setLoading(!!confirmLoadingProp), [confirmLoadingProp]);

  useEffect(() => {
    if (!keyboard || !visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [keyboard, visible, onClose]);

  const sizes: Record<ModalSize, string> = {
    sm: 'w-80',        // 20rem
    md: 'w-modal',     // 25rem (design token from tailwind.config.ts)
    lg: 'max-w-2xl w-full',
    xl: 'max-w-3xl w-full',
  };

  const panelWidthStyle = useMemo(() => {
    if (!width) return undefined;
    return { width: typeof width === 'number' ? `${width}px` : width } as React.CSSProperties;
  }, [width]);

  const iconNode = useMemo(() => {
    const common = 'shrink-0';
    if (variant === 'info') return <Info className={`text-info ${common}`} size={18} aria-hidden />;
    if (variant === 'success') return <CheckCircle2 className={`text-success ${common}`} size={18} aria-hidden />;
    if (variant === 'warning') return <TriangleAlert className={`text-warning ${common}`} size={18} aria-hidden />;
    if (variant === 'danger' || variant === 'confirm') return <AlertCircle className={`text-error ${common}`} size={18} aria-hidden />;
    return null;
  }, [variant]);

  const titleNode = useMemo(() => {
    if (!title) return null;
    return (
      <div className="flex items-center gap-2">
        {iconNode}
        <div className="text-base font-medium text-gray-900 leading-6">{title}</div>
      </div>
    );
  }, [title, iconNode]);

  if (!visible) return null;

  const handleMaskClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!maskClosable) return;
    if (e.target === overlayRef.current) onClose?.();
  };

  const handleOk = async () => {
    if (!onOk) return onClose?.();
    const ret = onOk();
    if (ret && typeof (ret as Promise<unknown>).then === 'function') {
      try {
        setLoading(true);
        await (ret as Promise<unknown>);
        setLoading(false);
        onClose?.();
      } catch {
        setLoading(false);
      }
    }
  };

  const renderFooter = () => {
    if (footer === null) return null;
    if (typeof footer !== 'undefined') return <div className="px-5 py-3 border-t border-gray-100">{footer}</div>;
    // Only render default footer when onOk is provided (avoid duplicate OK/Cancel in consumers)
    if (!onOk) return null;
    const cancelVariant = cancelButtonProps?.['variant' as never] ?? 'default';
    const okVariant = okButtonProps?.['variant' as never] ?? (variant === 'danger' || variant === 'warning' ? 'warning' : 'primary');
    return (
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
        {!hideCancel && (
          <Button
            variant={cancelVariant}
            onClick={onClose}
            {...cancelButtonProps}
          >
            {cancelText}
          </Button>
        )}
        <Button
          variant={okVariant}
          onClick={handleOk}
          disabled={loading}
          {...okButtonProps}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" aria-hidden />
              {okText}
            </span>
          ) : (
            okText
          )}
        </Button>
      </div>
    );
  };

  const isDrawer = mode === 'drawer';

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 ${isDrawer ? 'flex items-stretch' : `flex ${centered ? 'items-center' : 'items-start'} justify-center p-4`} bg-black/40 ${wrapperClassName}`}
      style={{ zIndex }}
      onMouseDown={handleMaskClick}
      aria-hidden={!visible}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? headerId : undefined}
        aria-describedby={bodyId}
        className={[
          'relative',
          isDrawer
            ? (
                placement === 'left' ? 'h-full w-auto max-w-full mr-auto' :
                placement === 'right' ? 'h-full w-auto max-w-full ml-auto' :
                placement === 'top' ? 'w-full max-h-full mt-0' :
                'w-full max-h-full mb-0'
              )
            : `${sizes[size]}`,
          className,
        ].join(' ')}
        style={panelWidthStyle}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={`bg-white ${isDrawer ? 'h-full ' + (width ? '' : 'w-modal ') + 'rounded-none' : 'rounded-xl'} shadow-elevation-3 overflow-hidden`}>
          <div className={`px-5 ${isDrawer ? 'py-4' : 'pt-4 pb-3'} flex items-center justify-between gap-2 border-b border-gray-100`}>
            <div id={headerId} className="min-h-6">{titleNode}</div>
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
          <div id={bodyId} className={`px-5 py-4 text-sm leading-6 text-gray-700 ${isDrawer ? 'h-[calc(100%-3.25rem-3.25rem)] overflow-auto nice-scrollbar' : ''}`}>
            {children}
          </div>
          {renderFooter()}
        </div>
      </div>
    </div>
  );
}
