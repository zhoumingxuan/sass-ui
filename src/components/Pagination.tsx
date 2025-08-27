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
    <div className="flex items-center space-x-2 text-sm">
      <Button
        variant="default"
        outline
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="h-9 px-3"
      >
        上一页
      </Button>
      <span>
        {page} / {totalPages}
      </span>
      <Button
        variant="default"
        outline
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="h-9 px-3"
      >
        下一页
      </Button>
    </div>
  );
}
