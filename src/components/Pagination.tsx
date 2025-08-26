'use client';

import Button from './Button';

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="flex justify-end items-center gap-2 p-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm">
      <Button
        variant="default"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-2 py-1"
      >
        上一页
      </Button>
      <span>
        {page} / {totalPages}
      </span>
      <Button
        variant="default"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-2 py-1"
      >
        下一页
      </Button>
    </div>
  );
}
