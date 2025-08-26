'use client';

import { ReactNode } from 'react';
import Pagination from './Pagination';

export type Column<T> = {
  key: keyof T;
  title: ReactNode;
};

export default function Table<T extends Record<string, ReactNode>>({
  columns,
  data,
  page,
  pageSize,
  total,
  onPageChange,
}: {
  columns: Column<T>[];
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="border-b bg-gray-50 p-2 text-left">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map((col) => (
                <td key={String(col.key)} className="p-2 border-b">
                  {row[col.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
    </div>
  );
}
