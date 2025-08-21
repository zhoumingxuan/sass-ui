import { ReactNode } from 'react';

type Props = {
  title?: string;
  children: ReactNode;
};

export default function Card({ title, children }: Props) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow mb-4">
      {title && <h3 className="mt-0 mb-4 text-lg text-primary">{title}</h3>}
      {children}
    </div>
  );
}
