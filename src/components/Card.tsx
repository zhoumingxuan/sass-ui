import { ReactNode } from 'react';

type Props = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export default function Card({ title, children, className = '' }: Props) {
  return (
    <div
      className={`mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {title && (
        <h3 className="mt-0 mb-4 text-lg font-medium text-gray-800">{title}</h3>
      )}
      {children}
    </div>
  );
}
