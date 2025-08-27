import { ReactNode } from 'react';

type Props = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export default function Card({ title, children, className = '' }: Props) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md ${className}`}
    >
      {title ? (
        <>
          <div className="px-6 pt-5 pb-3 text-gray-700 font-medium">{title}</div>
          <div className="px-6 pb-6">{children}</div>
        </>
      ) : (
        <div className="p-4 md:p-6">{children}</div>
      )}
    </div>
  );
}
