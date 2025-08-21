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
      <div className="bg-white p-4 rounded-md w-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="m-0">{title}</h3>
          <button
            onClick={onClose}
            className="bg-transparent border-0 text-xl cursor-pointer"
          >
            ×
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
