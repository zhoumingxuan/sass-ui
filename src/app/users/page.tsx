"use client";

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Table, { Column } from '@/components/Table';
import { TextInput } from '@/components/Input';
import Breadcrumbs from '@/components/Breadcrumbs';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Pill from '@/components/Pill';
import ActionLink from '@/components/ActionLink';
import { menuItems, footerItems } from '@/components/menuItems';
import { Search, Plus } from 'lucide-react';

interface Row {
  id: string;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'disabled';
}

const STATUS_META: Record<Row['status'], { label: string; tone: Parameters<typeof Pill>[0]['tone'] }> = {
  active: { label: '已激活', tone: 'success' },
  pending: { label: '待激活', tone: 'warning' },
  disabled: { label: '已停用', tone: 'neutral' },
};

const USERS: Row[] = [
  { id: 'USR-001', username: '张三', email: 'zhangsan@example.com', role: '管理员', status: 'active' },
  { id: 'USR-002', username: '李四', email: 'lisi@example.com', role: '运营', status: 'pending' },
  { id: 'USR-003', username: '王五', email: 'wangwu@example.com', role: '审核', status: 'disabled' },
  { id: 'USR-004', username: '赵六', email: 'zhaoliu@example.com', role: '访客', status: 'active' },
];

export default function Users() {
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<Row | null>(null);
  const [deletingUser, setDeletingUser] = useState<Row | null>(null);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof Row>('username');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([]);
  const [selectedRows, setSelectedRows] = useState<Row[]>([]);

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: 'username', title: '用户名', minWidth: 160, flex: 1.2, sortable: true },
      {
        key: 'email',
        title: '邮箱',
        minWidth: 220,
        flex: 1.4,
        tooltip: (row) => row.email,
      },
      { key: 'role', title: '角色', minWidth: 140, sortable: true },
      {
        key: 'status',
        title: '状态',
        minWidth: 140,
        intent: 'status',
        sortable: true,
        render: (row) => <Pill tone={STATUS_META[row.status].tone}>{STATUS_META[row.status].label}</Pill>,
      },
      {
        key: 'actions',
        title: '操作',
        intent: 'actions',
        align: 'right',
        minWidth: 220,
        render: (row) => (
          <div className="flex items-center justify-end gap-2" data-table-row-trigger="ignore">
            <ActionLink emphasized onClick={() => setEditingUser(row)}>
              修改
            </ActionLink>
            <ActionLink onClick={() => setDeletingUser(row)}>删除</ActionLink>
          </div>
        ),
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? USERS.filter((user) => {
          const haystack = [
            user.username,
            user.email,
            user.role,
            STATUS_META[user.status].label,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        })
      : USERS.slice();

    base.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'status': {
          const order: Record<Row['status'], number> = { disabled: 0, pending: 1, active: 2 };
          return (order[a.status] - order[b.status]) * dir;
        }
        default:
          return String(a[sortKey]).localeCompare(String(b[sortKey]), 'zh', { numeric: true }) * dir;
      }
    });

    return base;
  }, [query, sortDirection, sortKey]);

  useEffect(() => {
    setSelectedKeys((keys) => keys.filter((key) => filtered.some((row) => row.id === key)));
    setSelectedRows((rows) => rows.filter((row) => filtered.some((item) => item.id === row.id)));
  }, [filtered]);

  const total = filtered.length;
  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const sortableFields: Array<keyof Row> = ['username', 'role', 'status'];
  const handleSort = (key: Column<Row>['key']) => {
    if (!sortableFields.includes(key as keyof Row)) {
      return;
    }
    const normalized = key as keyof Row;
    if (normalized === sortKey) {
      setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(normalized);
      setSortDirection('asc');
    }
  };

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handlePageSize = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">用户管理</div>}
    >
      <Breadcrumbs />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">用户管理</h2>
        <Button onClick={() => setShowAdd(true)} icon={<Plus />}>
          新增用户
        </Button>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-base font-semibold text-gray-800">用户</div>
            <div className="text-xs text-gray-500">账户权限与状态概览</div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="small" appearance="ghost" variant="default">
              导入
            </Button>
            <Button size="small" appearance="ghost" variant="default">
              导出
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <input
              type="search"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索用户"
              className="h-9 w-full rounded-lg border border-gray-200 pl-8 pr-3 text-sm text-gray-700 placeholder:text-gray-400 transition-[box-shadow,border-color] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="mt-4">
          <Table<Row>
            card={false}
            columns={columns}
            data={paged}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={handlePageSize}
            pageSizeOptions={[5, 10, 20]}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            rowKey={(row) => row.id}
            selection={{
              selectedKeys,
              onChange: (keys, rows) => {
                setSelectedKeys(keys);
                setSelectedRows(rows);
              },
              headerTitle: '选择用户',
            }}
            footerExtra={
              selectedRows.length > 0 ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <span>批量操作：</span>
                  <ActionLink onClick={() => console.log('disable', selectedRows.length)}>批量停用</ActionLink>
                  <ActionLink onClick={() => console.log('reset-password', selectedRows.length)}>重置密码</ActionLink>
                </div>
              ) : null
            }
          />
        </div>
      </Card>

      <Modal open={showAdd} title="新增用户" onClose={() => setShowAdd(false)}>
        <form className="flex flex-col gap-3">
          <TextInput placeholder="用户名" />
          <TextInput placeholder="邮箱" />
          <div className="flex justify-end gap-2">
            <Button appearance="ghost" variant="default" type="button" onClick={() => setShowAdd(false)}>
              取消
            </Button>
            <Button type="button" onClick={() => setShowAdd(false)}>
              保存
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(editingUser)} title="修改用户" onClose={() => setEditingUser(null)}>
        <form className="flex flex-col gap-3">
          <TextInput defaultValue={editingUser?.username ?? ''} placeholder="用户名" />
          <TextInput defaultValue={editingUser?.email ?? ''} placeholder="邮箱" />
          <div className="flex justify-end gap-2">
            <Button appearance="ghost" variant="default" type="button" onClick={() => setEditingUser(null)}>
              取消
            </Button>
            <Button type="button" onClick={() => setEditingUser(null)}>
              更新
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deletingUser)} title="删除用户" onClose={() => setDeletingUser(null)}>
        <p className="mb-4 text-sm text-gray-600">
          确定删除 {deletingUser?.username ?? ''} 吗？该操作无法撤销。
        </p>
        <div className="flex justify-end gap-2">
          <Button appearance="ghost" variant="default" type="button" onClick={() => setDeletingUser(null)}>
            取消
          </Button>
          <Button variant="error" type="button" onClick={() => setDeletingUser(null)}>
            删除
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}