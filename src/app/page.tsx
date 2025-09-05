'use client';

import { useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { menuItems, footerItems } from '@/components/menuItems';
import Button from '@/components/Button';
import Card from '@/components/Card';
import {
  TextInput,
  NumberInput,
  PasswordInput,
  SelectInput,
  DateInput,
  DateRangeInput,
} from '@/components/Input';
import Table, { Column } from '@/components/Table';
import Alert from '@/components/Alert';
import { Plus, Search, Check, AlertTriangle, Info, ArrowRight } from 'lucide-react';

type Row = { name: string; age: number };

export default function Home() {
  const columns: Column<Row>[] = [
    { key: 'name', title: '姓名', minWidth: 160, sortable: true },
    { key: 'age', title: '年龄', align: 'right', minWidth: 80, sortable: true },
  ];

  const rawData: Row[] = [
    { name: '张三', age: 28 },
    { name: '李四', age: 32 },
    { name: '王五', age: 26 },
    { name: '赵六', age: 30 },
  ];

  // 搜索 / 排序 / 分页
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof Row>('age');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(2);

  // 过滤 + 排序
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? rawData.filter((r) => r.name.toLowerCase().includes(q) || String(r.age).includes(q))
      : rawData.slice();

    base.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDirection === 'asc' ? av - bv : bv - av;
      }
      return (String(av)).localeCompare(String(bv), 'zh', { numeric: true }) * (sortDirection === 'asc' ? 1 : -1);
    });
    return base;
  }, [rawData, query, sortKey, sortDirection]);

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // 排序点击逻辑
  const handleSort = (key: keyof Row) => {
    if (key === sortKey) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // 搜索 / 页容量变更时回到第 1 页
  const handleSearch = (v: string) => {
    setQuery(v);
    setPage(1);
  };
  const handlePageSize = (n: number) => {
    setPageSize(n);
    setPage(1);
  };

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">Sass UI Demo</div>}
    >
      <Card title="按钮">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <Button size="large" variant="primary">大按钮</Button>
            <Button size="large" variant="default">大按钮</Button>
            <Button size="large" variant="success">大按钮</Button>
            <Button size="large" variant="warning">大按钮</Button>
            <Button size="large" variant="error">大按钮</Button>
            <Button size="large" variant="info">大按钮</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">中按钮</Button>
            <Button variant="default">中按钮</Button>
            <Button variant="success">中按钮</Button>
            <Button variant="warning">中按钮</Button>
            <Button variant="error">中按钮</Button>
            <Button variant="info">中按钮</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="small" variant="primary">小按钮</Button>
            <Button size="small" variant="default">小按钮</Button>
            <Button size="small" variant="success">小按钮</Button>
            <Button size="small" variant="warning">小按钮</Button>
            <Button size="small" variant="error">小按钮</Button>
            <Button size="small" variant="info">小按钮</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" icon={<Plus />}>新增</Button>
            <Button appearance="ghost" variant="default" icon={<Search />}>搜索</Button>
            <Button variant="success" icon={<Check />}>提交</Button>
            <Button variant="warning" icon={<AlertTriangle />}>警告</Button>
            <Button variant="error" icon={<AlertTriangle />}>错误</Button>
            <Button variant="info" icon={<Info />}>信息</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary" icon={<ArrowRight />} iconPosition="right">下一步</Button>
            <Button variant="primary" aria-label="新增" icon={<Plus />} />
            <Button variant="primary" icon={<Plus />} disabled>禁用</Button>
          </div>
          <div className="col-span-12 md:col-span-6"><DateInput label="��������" disabledDate={(d) => d.getDay() === 0 || d.getDay() === 6} /></div>
          <div className="col-span-12 md:col-span-6"><DateRangeInput label="���ڷ�Χ" disabledDate={(d) => d.getDay() === 0 || d.getDay() === 6} /></div>
        </div>
      </Card>

      <Card title="输入">
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 md:col-span-6"><TextInput label="文本输入" placeholder="请输入文本" /></div>
          <div className="col-span-12 md:col-span-6"><NumberInput label="数字输入" placeholder="请输入数字" /></div>
          <div className="col-span-12 md:col-span-6"><PasswordInput label="密码输入" placeholder="请输入密码" /></div>
          <div className="col-span-12 md:col-span-6">
            <SelectInput label="选择输入" options={[{ value: '', label: '请选择' }, { value: '1', label: '选项1' }]} />
          </div>
          <div className="col-span-12 md:col-span-6"><DateInput label="日期输入" /></div>
          <div className="col-span-12 md:col-span-6"><DateRangeInput label="日期范围" /></div>
        </div>
      </Card>

      <Table<Row>
        title="员工"
        columns={columns}
        data={paged}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={handlePageSize}
        pageSizeOptions={[2, 4, 10]}
        onSearch={handleSearch}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        stickyHeader
      />

      <Card title="提示">
        <div className="flex flex-col space-y-3">
          <Alert variant="success">操作成功</Alert>
          <Alert variant="warning">警告信息</Alert>
          <Alert variant="error">错误信息</Alert>
          <Alert variant="info">提示信息</Alert>
        </div>
      </Card>
    </Layout>
  );
}
