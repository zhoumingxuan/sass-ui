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
        <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="h-10 px-6 text-left">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length > 0 ? (
            data.map((row, idx) => (
              <tr
                key={idx}
                className="h-12 odd:bg-white even:bg-gray-50 hover:bg-primary/3"
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-6">
                    {row[col.key] as ReactNode}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="py-10 text-center text-gray-400"
              >
                暂无数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex justify-end pt-4">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
