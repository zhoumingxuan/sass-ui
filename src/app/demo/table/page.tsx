'use client';

import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Table, { Column } from '@/components/Table';
import Button from '@/components/Button';
import Pill from '@/components/Pill';
import ProgressBar from '@/components/ProgressBar';
import ActionLink from '@/components/ActionLink';
import { menuItems, footerItems } from '@/components/menuItems';
import { Plus, Filter, RefreshCw } from 'lucide-react';

type Row = {
  id: string;
  project: string;
  owner: string;
  status: 'planning' | 'design' | 'developing' | 'review' | 'launched';
  progress: number;
  budget: string;
  startAt: string;
  endAt: string;
  risk: 'low' | 'medium' | 'high';
};

const STATUS_META: Record<Row['status'], { label: string; tone: Parameters<typeof Pill>[0]['tone'] }> = {
  planning: { label: '规划中', tone: 'neutral' },
  design: { label: '设计评审', tone: 'primary' },
  developing: { label: '研发中', tone: 'info' },
  review: { label: '验收中', tone: 'warning' },
  launched: { label: '已上线', tone: 'success' },
};

const RISK_META: Record<Row['risk'], { label: string; tone: Parameters<typeof Pill>[0]['tone'] }> = {
  low: { label: '低', tone: 'success' },
  medium: { label: '中', tone: 'warning' },
  high: { label: '高', tone: 'danger' },
};

const PROJECTS: Row[] = [
  {
    id: 'PRJ-001',
    project: '营销自动化平台',
    owner: '刘洋',
    status: 'developing',
    progress: 62,
    budget: '¥320,000',
    startAt: '2025-05-12',
    endAt: '2025-11-30',
    risk: 'medium',
  },
  {
    id: 'PRJ-002',
    project: '企业知识库升级',
    owner: '王琪',
    status: 'design',
    progress: 34,
    budget: '¥180,000',
    startAt: '2025-06-01',
    endAt: '2025-09-18',
    risk: 'low',
  },
  {
    id: 'PRJ-003',
    project: 'BI 仪表盘重构',
    owner: '张敏',
    status: 'planning',
    progress: 15,
    budget: '¥240,000',
    startAt: '2025-07-05',
    endAt: '2025-12-20',
    risk: 'medium',
  },
  {
    id: 'PRJ-004',
    project: '客服机器人 2.0',
    owner: '陈伟',
    status: 'review',
    progress: 88,
    budget: '¥410,000',
    startAt: '2025-03-10',
    endAt: '2025-08-15',
    risk: 'high',
  },
  {
    id: 'PRJ-005',
    project: '移动端性能优化',
    owner: '韩雪',
    status: 'developing',
    progress: 54,
    budget: '¥150,000',
    startAt: '2025-04-22',
    endAt: '2025-10-01',
    risk: 'medium',
  },
  {
    id: 'PRJ-006',
    project: '国际化落地',
    owner: '李博',
    status: 'planning',
    progress: 20,
    budget: '¥260,000',
    startAt: '2025-06-15',
    endAt: '2025-12-31',
    risk: 'low',
  },
  {
    id: 'PRJ-007',
    project: '安全审计体系',
    owner: '周楠',
    status: 'review',
    progress: 76,
    budget: '¥350,000',
    startAt: '2025-02-18',
    endAt: '2025-08-05',
    risk: 'high',
  },
  {
    id: 'PRJ-008',
    project: '企业门户改版',
    owner: '赵倩',
    status: 'launched',
    progress: 100,
    budget: '¥298,000',
    startAt: '2024-12-01',
    endAt: '2025-06-30',
    risk: 'low',
  },
];

export default function TableDemo() {
  const columns: Column<Row>[] = useMemo(
    () => [
      {
        key: 'project',
        title: '项目',
        minWidth: 240,
        flex: 2,
        sortable: true,
        render: (row) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900">{row.project}</div>
            <div className="text-xs text-gray-500">{row.id}</div>
          </div>
        ),
      },
      { key: 'owner', title: '负责人', minWidth: 140, flex: 1 },
      {
        key: 'status',
        title: '状态',
        minWidth: 140,
        intent: 'status',
        render: (row) => <Pill tone={STATUS_META[row.status].tone}>{STATUS_META[row.status].label}</Pill>,
      },
      {
        key: 'progress',
        title: '进度',
        align: 'right',
        minWidth: 160,
        sortable: true,
        render: (row) => (
          <div className="flex items-center justify-end gap-3">
            <ProgressBar value={row.progress} showValue className="w-28" tone={row.progress >= 80 ? 'success' : 'primary'} />
          </div>
        ),
      },
      { key: 'budget', title: '预算', align: 'right', minWidth: 140 },
      { key: 'startAt', title: '开始', minWidth: 140, sortable: true },
      { key: 'endAt', title: '结束', minWidth: 140, sortable: true },
      {
        key: 'risk',
        title: '风险',
        minWidth: 120,
        intent: 'status',
        render: (row) => <Pill tone={RISK_META[row.risk].tone}>{RISK_META[row.risk].label}</Pill>,
      },
      {
        key: 'actions',
        title: '操作',
        intent: 'actions',
        align: 'right',
        minWidth: 220,
        render: (row) => (
          <div className="flex items-center justify-end gap-2" data-table-row-trigger="ignore">
            <ActionLink emphasized>详情</ActionLink>
            <ActionLink onClick={() => console.log('promote', row.id)}>
              {row.status === 'launched' ? '归档' : '推进'}
            </ActionLink>
          </div>
        ),
      },
    ],
    [],
  );

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof Row>('progress');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([]);
  const [selectedRows, setSelectedRows] = useState<Row[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? PROJECTS.filter((row) => {
          const haystack = [
            row.project,
            row.owner,
            STATUS_META[row.status].label,
            row.budget,
            row.startAt,
            row.endAt,
            row.risk,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        })
      : PROJECTS.slice();

    base.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'progress':
          return (a.progress - b.progress) * dir;
        case 'startAt':
        case 'endAt':
          return (new Date(a[sortKey]).getTime() - new Date(b[sortKey]).getTime()) * dir;
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

  const sortableFields: Array<keyof Row> = ['project', 'progress', 'startAt', 'endAt'];
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

  const handleSearch = (value: string) => {
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
      header={<div className="text-xl font-semibold text-gray-800">表格示例</div>}
    >
      <Card>
        <div className="space-y-2">
          <div className="text-lg font-semibold text-gray-800">数据密集型场景</div>
          <p className="text-sm text-gray-500">
            支持多列布局、批量选择、操作列、排序以及键盘焦点管理，适用于后台管理系统典型的项目或任务列表。
          </p>
        </div>
      </Card>

      <Table<Row>
        className="mt-6"
        title="项目工单"
        columns={columns}
        data={paged}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={handlePageSize}
        pageSizeOptions={[5, 10, 20]}
        onSearch={handleSearch}
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
          headerTitle: '选择全部项目',
        }}
        toolbar={
          <div className="flex items-center gap-2">
            <Button size="small" variant="primary" icon={<Plus />}>
              新建项目
            </Button>
            <Button size="small" appearance="ghost" variant="default" icon={<Filter />}>
              筛选
            </Button>
            <Button size="small" appearance="ghost" variant="default" icon={<RefreshCw />}>
              刷新
            </Button>
          </div>
        }
        footerExtra={
          selectedRows.length > 0 ? (
            <div className="flex items-center gap-2 text-gray-500">
              <span>批量操作：</span>
              <ActionLink onClick={() => console.log('export', selectedRows.length)}>导出选中</ActionLink>
            </div>
          ) : null
        }
      />
    </Layout>
  );
}