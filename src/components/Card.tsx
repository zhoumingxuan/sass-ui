import { ReactNode } from 'react';

type Props = {
  title?: string;
  children: ReactNode;
  className?: string;
  closable?: boolean;
  onClose?: () => void;
};

export default function Card({
  title,
  children,
  className = '',
  closable = false,
  onClose,
}: Props) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md ${className}`}
      /* 让包含内容的卡片在指定高度下能自适应伸展 */
      style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
    >
      {title ? (
        <>
          <div className="flex justify-between items-center px-6 pt-5 pb-3 shrink-0">
            <div className="text-gray-700 font-medium text-lg">{title}</div>
            {closable && (
              <a
                href="#"
                role="button"
                onClick={(e) => { e.preventDefault(); onClose?.(); }}
                aria-label="关闭"
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 no-underline inline-flex items-center justify-center"
              >
                ×
              </a>
            )}
          </div>
          <div className="px-6 pb-6 flex-1 min-h-0 flex flex-col">{children}</div>
        </>
      ) : (
        <div className="p-4 md:p-6 flex-1 min-h-0 flex flex-col">{children}</div>
      )}
    </div>
  );
}
