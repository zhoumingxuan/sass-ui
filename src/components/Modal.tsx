'use client';

import { ReactNode } from 'react';

type Props = {
  show: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ show, title, children, onClose }: Props) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white p-4 rounded-lg w-modal shadow-elevation-3">
        <div className="flex justify-between items-center mb-4">
          <h3 className="m-0">{title}</h3>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="p-2 rounded-lg text-xl leading-none hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
          >
            ×
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
