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
    >
      {title ? (
        <>
          <div className="flex justify-between items-center px-6 pt-5 pb-3">
            <div className="text-gray-700 font-medium text-lg">{title}</div>
            {closable && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            )}
          </div>
          <div className="px-6 pb-6">{children}</div>
        </>
      ) : (
        <div className="p-4 md:p-6">{children}</div>
      )}
    </div>
  );
}
