'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Table, { Column } from '@/components/Table';
import { useMemo, useState } from 'react';
import { menuItems, footerItems } from '@/components/menuItems';

type Row = { name: string; age: number };

export default function TableDemo() {
  const columns: Column<Row>[] = [
    { key: 'name', title: '姓名', minWidth: 160, sortable: true },
    { key: 'age', title: '年龄', align: 'right', minWidth: 80, sortable: true },
  ];

  const data: Row[] = [
    { name: '张三', age: 28 },
    { name: '李四', age: 32 },
    { name: '王五', age: 26 },
    { name: '赵六', age: 30 },
  ];

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof Row>('age');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(2);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? data.filter((r) => r.name.toLowerCase().includes(q) || String(r.age).includes(q))
      : data.slice();
    base.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDirection === 'asc' ? av - bv : bv - av;
      }
      return String(av).localeCompare(String(bv), 'zh', { numeric: true }) * (sortDirection === 'asc' ? 1 : -1);
    });
    return base;
  }, [data, query, sortKey, sortDirection]);

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: keyof Row) => {
    if (key === sortKey) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">表格示例</div>}
    >
      <Card>
        <Table<Row>
          title="员工"
          columns={columns}
          data={paged}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
          pageSizeOptions={[2, 4, 10]}
          onSearch={(v) => { setQuery(v); setPage(1); }}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          stickyHeader
        />
      </Card>
    </Layout>
  );
}

