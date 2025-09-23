'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Table, { Column } from '@/components/Table';
import GridTable, { GridColumn, RowActionsConfig } from '@/components/GridTable';
import Button from '@/components/Button';
import Pill from '@/components/Pill';
import ProgressBar from '@/components/ProgressBar';
import ActionLink from '@/components/ActionLink';
import { menuItems, footerItems } from '@/components/menuItems';
import { Plus, Filter, RefreshCw, Search } from 'lucide-react';

type Row = {
  id: string;
  project: string;
  owner: string;
  team: string;
  status: 'planning' | 'design' | 'developing' | 'review' | 'launched';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  completedTasks: number;
  totalTasks: number;
  budgetPlanned: number;
  budgetUsed: number;
  startAt: string;
  endAt: string;
  lastUpdated: string;
  risk: 'low' | 'medium' | 'high';
};

const STATUS_META: Record<Row['status'], { label: string; tone: Parameters<typeof Pill>[0]['tone'] }> = {
  planning: { label: '规划中', tone: 'neutral' },
  design: { label: '方案设计', tone: 'primary' },
  developing: { label: '研发中', tone: 'info' },
  review: { label: '验收中', tone: 'warning' },
  launched: { label: '已上线', tone: 'success' },
};

const PRIORITY_META: Record<Row['priority'], { label: string; tone: Parameters<typeof Pill>[0]['tone'] }> = {
  low: { label: '常规', tone: 'neutral' },
  medium: { label: '较高', tone: 'primary' },
  high: { label: '高', tone: 'warning' },
  urgent: { label: '紧急', tone: 'danger' },
};

const RISK_META: Record<Row['risk'], { label: string; tone: Parameters<typeof Pill>[0]['tone'] }> = {
  low: { label: '低', tone: 'success' },
  medium: { label: '中', tone: 'warning' },
  high: { label: '高', tone: 'danger' },
};

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'percent',
  maximumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const PROJECTS: Row[] = [
  {
    id: 'PRJ-001',
    project: '营销自动化平台',
    owner: '刘洋',
    team: '增长中台',
    status: 'developing',
    priority: 'high',
    progress: 62,
    completedTasks: 31,
    totalTasks: 50,
    budgetPlanned: 320000,
    budgetUsed: 210000,
    startAt: '2025-05-12',
    endAt: '2025-11-30',
    lastUpdated: '2025-09-16T10:20:00+08:00',
    risk: 'medium',
  },
  {
    id: 'PRJ-002',
    project: '企业知识库升级',
    owner: '王琪',
    team: '知识工程',
    status: 'design',
    priority: 'medium',
    progress: 36,
    completedTasks: 18,
    totalTasks: 50,
    budgetPlanned: 180000,
    budgetUsed: 76000,
    startAt: '2025-06-01',
    endAt: '2025-09-30',
    lastUpdated: '2025-09-14T15:05:00+08:00',
    risk: 'low',
  },
  {
    id: 'PRJ-003',
    project: 'BI 仪表盘重构',
    owner: '张敏',
    team: '数据分析',
    status: 'planning',
    priority: 'medium',
    progress: 18,
    completedTasks: 9,
    totalTasks: 50,
    budgetPlanned: 240000,
    budgetUsed: 42000,
    startAt: '2025-07-05',
    endAt: '2025-12-20',
    lastUpdated: '2025-09-10T09:00:00+08:00',
    risk: 'medium',
  },
  {
    id: 'PRJ-004',
    project: '客服机器人 2.0',
    owner: '陈伟',
    team: '智能服务',
    status: 'review',
    priority: 'urgent',
    progress: 88,
    completedTasks: 88,
    totalTasks: 100,
    budgetPlanned: 410000,
    budgetUsed: 398000,
    startAt: '2025-03-10',
    endAt: '2025-08-15',
    lastUpdated: '2025-09-18T11:35:00+08:00',
    risk: 'high',
  },
  {
    id: 'PRJ-005',
    project: '移动端性能优化',
    owner: '韩雪',
    team: '客户端工程',
    status: 'developing',
    priority: 'high',
    progress: 54,
    completedTasks: 27,
    totalTasks: 50,
    budgetPlanned: 150000,
    budgetUsed: 92000,
    startAt: '2025-04-22',
    endAt: '2025-10-01',
    lastUpdated: '2025-09-13T18:12:00+08:00',
    risk: 'medium',
  },
  {
    id: 'PRJ-006',
    project: '国际化落地',
    owner: '李博',
    team: '国际业务',
    status: 'planning',
    priority: 'medium',
    progress: 24,
    completedTasks: 12,
    totalTasks: 50,
    budgetPlanned: 260000,
    budgetUsed: 52000,
    startAt: '2025-06-15',
    endAt: '2025-12-31',
    lastUpdated: '2025-09-09T14:40:00+08:00',
    risk: 'low',
  },
  {
    id: 'PRJ-007',
    project: '安全审计体系',
    owner: '周楠',
    team: '安全响应',
    status: 'review',
    priority: 'high',
    progress: 76,
    completedTasks: 57,
    totalTasks: 75,
    budgetPlanned: 350000,
    budgetUsed: 312000,
    startAt: '2025-02-18',
    endAt: '2025-08-05',
    lastUpdated: '2025-09-17T09:45:00+08:00',
    risk: 'high',
  },
  {
    id: 'PRJ-008',
    project: '企业门户改版',
    owner: '赵婧',
    team: '品牌传播',
    status: 'launched',
    priority: 'low',
    progress: 100,
    completedTasks: 120,
    totalTasks: 120,
    budgetPlanned: 298000,
    budgetUsed: 286000,
    startAt: '2024-12-01',
    endAt: '2025-06-30',
    lastUpdated: '2025-08-28T16:22:00+08:00',
    risk: 'low',
  },
  {
    id: 'PRJ-009',
    project: '供应链可视化',
    owner: '孙雷',
    team: '供应链效能',
    status: 'design',
    priority: 'medium',
    progress: 42,
    completedTasks: 21,
    totalTasks: 50,
    budgetPlanned: 275000,
    budgetUsed: 134000,
    startAt: '2025-05-08',
    endAt: '2025-11-18',
    lastUpdated: '2025-09-15T12:05:00+08:00',
    risk: 'medium',
  },
  {
    id: 'PRJ-010',
    project: '实时监控体系',
    owner: '袁晨',
    team: '基础平台',
    status: 'developing',
    priority: 'urgent',
    progress: 68,
    completedTasks: 68,
    totalTasks: 100,
    budgetPlanned: 380000,
    budgetUsed: 248000,
    startAt: '2025-03-02',
    endAt: '2025-12-05',
    lastUpdated: '2025-09-16T20:10:00+08:00',
    risk: 'medium',
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
        semantic: 'text',
        render: (row) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900">{row.project}</div>
          </div>
        ),
      },
      { key: 'owner', title: '负责人', minWidth: 120, semantic: 'text' },
      {
        key: 'priority',
        title: '优先级',
        minWidth: 120,
        intent: 'status',
        semantic: 'text',
        render: (row) => <Pill tone={PRIORITY_META[row.priority].tone}>{PRIORITY_META[row.priority].label}</Pill>,
      },
      {
        key: 'status',
        title: '状态',
        minWidth: 120,
        intent: 'status',
        semantic: 'text',
        render: (row) => <Pill tone={STATUS_META[row.status].tone}>{STATUS_META[row.status].label}</Pill>,
      },
      {
        key: 'progress',
        title: '进度',
        minWidth: 180,
        sortable: true,
        semantic: 'number',
        render: (row) => (
          <div className="flex items-center justify-end gap-3">
            <ProgressBar
              value={row.progress}
              showValue
              className="w-32"
              tone={row.progress >= 80 ? 'success' : 'primary'}
            />
          </div>
        ),
      },
      {
        key: 'tasks',
        title: '任务',
        minWidth: 140,
        sortable: true,
        sortKey: 'completedTasks',
        semantic: 'number',
        render: (row) => (
          <div className="flex items-center justify-end gap-2">
            <span className="font-medium text-gray-900">{integerFormatter.format(row.completedTasks)}</span>
            <span className="text-xs text-gray-400">/ {integerFormatter.format(row.totalTasks)}</span>
          </div>
        ),
      },
      {
        key: 'budgetPlanned',
        title: '预算（计划）',
        minWidth: 160,
        sortable: true,
        semantic: 'currency',
        render: (row) => <span>{currencyFormatter.format(row.budgetPlanned)}</span>,
      },
      {
        key: 'budgetUsed',
        title: '预算（已用）',
        minWidth: 160,
        sortable: true,
        semantic: 'currency',
        render: (row) => <span>{currencyFormatter.format(row.budgetUsed)}</span>,
      },
      {
        key: 'burnRate',
        title: '消耗率',
        minWidth: 120,
        sortable: true,
        semantic: 'percent',
        render: (row) => {
          const ratio = row.budgetUsed / row.budgetPlanned;
          const tone = ratio > 1.1 ? 'text-danger-600' : ratio > 0.9 ? 'text-warning-500' : 'text-success-600';
          return <span className={`font-medium ${tone}`}>{percentFormatter.format(ratio)}</span>;
        },
      },
      { key: 'startAt', title: '开始时间', minWidth: 140, sortable: true, semantic: 'date' },
      { key: 'endAt', title: '结束时间', minWidth: 140, sortable: true, semantic: 'date' },
      {
        key: 'lastUpdated',
        title: '最近更新',
        minWidth: 160,
        sortable: true,
        semantic: 'datetime',
        render: (row) => dateTimeFormatter.format(new Date(row.lastUpdated)),
      },
      {
        key: 'risk',
        title: '风险',
        minWidth: 100,
        intent: 'status',
        semantic: 'text',
        render: (row) => <Pill tone={RISK_META[row.risk].tone}>{RISK_META[row.risk].label}</Pill>,
      }
    ],
    [],
  );

  const gridColumns: GridColumn<Row>[] = useMemo(
    () => [
      {
        key: 'id',
        title: '编号',
        fixed: 'left',
        semantic:'text',
      },
      {
        key: 'project',
        title: '项目',
      },
      {
        key: 'owner',
        title: '负责人',
      },
      {
        key: 'priority',
        title: '优先级',
        semantic:'text',
        render: (row) => <Pill tone={PRIORITY_META[row.priority].tone}>{PRIORITY_META[row.priority].label}</Pill>,
      },
      {
        key: 'progress',
        title: '进度',
        width: 200,
        semantic: 'text',
        render: (row) => (
          <div className="flex items-center justify-end gap-3 h-full block">
            <ProgressBar
              value={row.progress}
              showValue
              className="w-32"
              tone={row.progress >= 80 ? 'success' : 'primary'}
            />
          </div>
        ),
      },
      {
        key: 'budgetUsed',
        title: '已使用预算',
        semantic: 'number',
        render: (row) => <span>{currencyFormatter.format(row.budgetUsed)}</span>,
      },
      {
        key: 'lastUpdated',
        title: '最新更新时间',
        semantic: 'datetime',
        render: (row) => dateTimeFormatter.format(new Date(row.lastUpdated)),
      },
      {
        key: 'risk',
        title: '风险',
        semantic: 'text',
        render: (row) => <Pill tone={RISK_META[row.risk].tone}>{RISK_META[row.risk].label}</Pill>,
      }
    ],
    [],
  );

  const virtualRows = useMemo(() => {
    const multiplier = 60;
    const statuses: Row['status'][] = ['planning', 'design', 'developing', 'review', 'launched'];
    const priorities: Row['priority'][] = ['low', 'medium', 'high', 'urgent'];
    const risks: Row['risk'][] = ['low', 'medium', 'high'];
    const items: Row[] = [];
    const baseSize = PROJECTS.length;
    for (let i = 0; i < baseSize * multiplier; i += 1) {
      const source = PROJECTS[i % baseSize];
      const batch = Math.floor(i / baseSize);
      const variant = i % baseSize;
      const id = `${source.id}-G${(batch + 1).toString().padStart(2, '0')}-${(variant + 1)
        .toString()
        .padStart(2, '0')}`;
      const status = statuses[(batch + variant) % statuses.length];
      const priority = priorities[(variant + batch * 2) % priorities.length];
      const risk = risks[(batch + variant * 3) % risks.length];
      const progressSeed = (source.progress + batch * 11 + variant * 7) % 101;
      const progress = progressSeed === 0 ? 5 : progressSeed;
      const completedTasks = Math.min(
        source.totalTasks,
        Math.max(
          source.completedTasks,
          Math.round((progress / 100) * source.totalTasks),
        ),
      );
      const usageRatio = Math.min(1.25, 0.55 + ((batch % 12) * 0.05));
      const budgetUsed = Math.round(source.budgetPlanned * usageRatio);
      const startAtDate = new Date(source.startAt);
      startAtDate.setDate(startAtDate.getDate() + batch * 2);
      const endAtDate = new Date(source.endAt);
      endAtDate.setDate(endAtDate.getDate() + batch * 2 + (variant % 5));
      const updatedAt = new Date(source.lastUpdated);
      updatedAt.setHours(updatedAt.getHours() + batch * 6 + (variant % 3));

      items.push({
        ...source,
        id,
        project: `${source.project} · 第${batch + 1}批`,
        status,
        priority,
        risk,
        progress,
        completedTasks,
        budgetUsed,
        startAt: startAtDate.toISOString().slice(0, 10),
        endAt: endAtDate.toISOString().slice(0, 10),
        lastUpdated: updatedAt.toISOString(),
      });
    }
    return items;
  }, []);

  const [gridRows, setGridRows] = useState<Row[]>(virtualRows);
  const [gridLoading, setGridLoading] = useState(false);
  const [gridSelectedKeys, setGridSelectedKeys] = useState<Array<string | number>>([]);
  const [gridSelectedRows, setGridSelectedRows] = useState<Row[]>([]);
  const gridTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    setGridRows(virtualRows);
  }, [virtualRows]);

  useEffect(() => {
    if (gridRows.length === 0) {
      setGridSelectedKeys([]);
      setGridSelectedRows([]);
      return;
    }
    setGridSelectedKeys((keys) => keys.filter((key) => gridRows.some((row) => row.id === key)));
    setGridSelectedRows((rows) => rows.filter((row) => gridRows.some((item) => item.id === row.id)));
  }, [gridRows]);

  const gridSelectedBudget = useMemo(
    () => gridSelectedRows.reduce((total, row) => total + row.budgetUsed, 0),
    [gridSelectedRows],
  );

  const handleGridRefresh = () => {
    if (gridTimerRef.current) {
      window.clearTimeout(gridTimerRef.current);
    }
    setGridLoading(true);
    gridTimerRef.current = window.setTimeout(() => {
      setGridRows((rows) =>
        rows.map((row, index) => {
          if (index % 37 !== 0) {
            return row;
          }
          const drift = Math.max(-0.08, Math.min(0.12, (Math.random() - 0.5) * 0.2));
          const progress = Math.min(100, Math.max(0, row.progress + Math.round(drift * 100)));
          const budgetRatio = Math.min(
            1.2,
            Math.max(0.35, row.budgetUsed / row.budgetPlanned + drift * 0.6),
          );
          const budgetUsed = Math.round(row.budgetPlanned * budgetRatio);
          const completedTasks = Math.min(
            row.totalTasks,
            Math.max(0, Math.round((progress / 100) * row.totalTasks)),
          );
          return {
            ...row,
            progress,
            completedTasks,
            budgetUsed,
            lastUpdated: new Date().toISOString(),
          };
        }),
      );
      setGridLoading(false);
      gridTimerRef.current = null;
    }, 680);
  };

  const handleGridClear = () => {
    if (gridTimerRef.current) {
      window.clearTimeout(gridTimerRef.current);
      gridTimerRef.current = null;
    }
    setGridLoading(false);
    setGridRows([]);
    setGridSelectedKeys([]);
    setGridSelectedRows([]);
  };

  const handleGridReset = () => {
    if (gridTimerRef.current) {
      window.clearTimeout(gridTimerRef.current);
      gridTimerRef.current = null;
    }
    setGridLoading(false);
    setGridRows(virtualRows);
    setGridSelectedKeys([]);
    setGridSelectedRows([]);
  };

  useEffect(() => {
    return () => {
      if (gridTimerRef.current) {
        window.clearTimeout(gridTimerRef.current);
      }
    };
  }, []);

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<Column<Row>['key']>('progress');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([]);
  const [selectedRows, setSelectedRows] = useState<Row[]>([]);
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [simulateEmpty, setSimulateEmpty] = useState(false);

  useEffect(() => {
    if (!simulateLoading) {
      return;
    }
    const timer = window.setTimeout(() => setSimulateLoading(false), 1200);
    return () => window.clearTimeout(timer);
  }, [simulateLoading]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? PROJECTS.filter((row) => {
        const haystack = [
          row.project,
          row.owner,
          row.team,
          STATUS_META[row.status].label,
          PRIORITY_META[row.priority].label,
          RISK_META[row.risk].label,
          currencyFormatter.format(row.budgetPlanned),
          currencyFormatter.format(row.budgetUsed),
          row.startAt,
          row.endAt,
          integerFormatter.format(row.completedTasks),
          integerFormatter.format(row.totalTasks),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
      : PROJECTS.slice();

    base.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortKey === 'burnRate') {
        const ratioA = a.budgetUsed / a.budgetPlanned;
        const ratioB = b.budgetUsed / b.budgetPlanned;
        return (ratioA - ratioB) * dir;
      }
      switch (sortKey) {
        case 'progress':
          return (a.progress - b.progress) * dir;
        case 'budgetPlanned':
          return (a.budgetPlanned - b.budgetPlanned) * dir;
        case 'budgetUsed':
          return (a.budgetUsed - b.budgetUsed) * dir;
        case 'completedTasks':
          return (a.completedTasks - b.completedTasks) * dir;
        case 'totalTasks':
          return (a.totalTasks - b.totalTasks) * dir;
        case 'startAt':
          return (new Date(a.startAt).getTime() - new Date(b.startAt).getTime()) * dir;
        case 'endAt':
          return (new Date(a.endAt).getTime() - new Date(b.endAt).getTime()) * dir;
        case 'lastUpdated':
          return (new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()) * dir;
        default: {
          if (typeof sortKey === 'string' && sortKey in a && sortKey in b) {
            const valueA = a[sortKey as keyof Row];
            const valueB = b[sortKey as keyof Row];
            const strA = valueA == null ? '' : String(valueA);
            const strB = valueB == null ? '' : String(valueB);
            return strA.localeCompare(strB, 'zh', { numeric: true }) * dir;
          }
          return 0;
        }
      }
    });

    return base;
  }, [query, sortDirection, sortKey]);

  const dataset = useMemo(() => (simulateEmpty ? [] : filtered), [filtered, simulateEmpty]);

  useEffect(() => {
    setSelectedKeys((keys) => keys.filter((key) => dataset.some((row) => row.id === key)));
    setSelectedRows((rows) => rows.filter((row) => dataset.some((item) => item.id === row.id)));
  }, [dataset]);

  const total = dataset.length;
  const paged = useMemo(
    () => dataset.slice((page - 1) * pageSize, page * pageSize),
    [dataset, page, pageSize],
  );

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize) || 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, pageSize, total]);

  const handleSort = (key: Column<Row>['key']) => {
    const column = columns.find((col) => col.key === key);
    if (!column || !(column.sortable ?? false)) {
      return;
    }
    const targetKey = (column.sortKey ?? column.key) as Column<Row>['key'];
    if (targetKey === sortKey) {
      setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(targetKey);
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

  const selectedBudget = useMemo(
    () => selectedRows.reduce((sum, row) => sum + row.budgetUsed, 0),
    [selectedRows],
  );

  const emptyState = (
    <div className="py-12 text-center text-sm text-gray-500">
      <p className="text-base font-medium text-gray-700">暂无项目数据</p>
      <p className="mt-1 text-xs text-gray-400">可以尝试调整筛选或恢复示例数据。</p>
      <div className="mt-3 flex justify-center">
        <ActionLink onClick={() => setSimulateEmpty(false)}>恢复示例数据</ActionLink>
      </div>
    </div>
  );

  // ===== GridTable：行内操作（通用配置）=====
  const gridRowActions: RowActionsConfig<Row> = useMemo(
    () => ({
      title: '操作',
      fixed: 'right',
      align: 'center',
      // width: 200, // 如需要固定宽度可打开
      getActions: (row) => [
        { key: 'detail', label: '详情', emphasized: true, onClick: () => console.log('detail', row.id) },
        // 示例：根据状态决定第二个动作的含义，仅作为演示；真实场景你可以返回任意操作数组
        row.status === 'launched'
          ? { key: 'archive', label: '归档', onClick: () => console.log('archive', row.id) }
          : { key: 'promote', label: '推进', onClick: () => console.log('promote', row.id) },
      ],
    }),
    [],
  );

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">表格示例</div>}
    >
      <Card>
        <div className="space-y-2">
          <div className="text-lg font-semibold text-gray-800">数据密集型场景</div>
          <p className="text-sm text-gray-500">展示列语义对齐、批量选择、空态与加载态切换，支持项目场景的全流程管理表格。</p>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-base font-semibold text-gray-800">项目工单</div>
            <div className="text-xs text-gray-500">覆盖预算、进度、风险等核心信息，便于横向对比和批量处理。</div>
          </div>
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
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <input
              type="search"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索项目"
              className="h-9 w-full rounded-lg border border-gray-200 pl-8 pr-3 text-sm text-gray-700 placeholder:text-gray-400 transition-[box-shadow,border-color] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              appearance="ghost"
              variant="default"
              onClick={() => setSimulateEmpty((prev) => !prev)}
            >
              {simulateEmpty ? '恢复数据' : '展示空态'}
            </Button>
            <Button
              size="small"
              appearance="ghost"
              variant="default"
              onClick={() => setSimulateLoading(true)}
            >
              模拟加载态
            </Button>
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
            loading={simulateLoading}
            emptyState={emptyState}
            selection={{
              selectedKeys,
              onChange: (keys, rows) => {
                setSelectedKeys(keys);
                setSelectedRows(rows);
              },
              headerTitle: '选择全部项目',
            }}
            footerExtra={
              selectedRows.length > 0 ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <span>批量操作</span>
                  <ActionLink onClick={() => console.log('export', selectedRows.length)}>导出选中</ActionLink>
                  <span className="hidden sm:inline text-xs text-gray-400">
                    已选预算：{currencyFormatter.format(selectedBudget)}
                  </span>
                </div>
              ) : null
            }
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-base font-semibold text-gray-800">虚拟滚动栅格表</div>
            <div className="text-xs text-gray-500">用于超大数据集的滚动、固定列与快捷选择演示。</div>
          </div>
          <div className="text-xs text-gray-500">
            总计 {integerFormatter.format(gridRows.length)} 行
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="small"
              appearance="ghost"
              variant="default"
              icon={<RefreshCw />}
              onClick={handleGridRefresh}
            >
              批量刷新
            </Button>
            <Button size="small" appearance="ghost" variant="default" onClick={handleGridClear}>
              清空数据
            </Button>
            <Button size="small" appearance="ghost" variant="default" onClick={handleGridReset}>
              恢复数据
            </Button>
          </div>
          {gridSelectedRows.length > 0 ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>已选 {gridSelectedRows.length} 项</span>
              <span className="hidden sm:inline text-gray-400">
                预算合计 {currencyFormatter.format(gridSelectedBudget)}
              </span>
              <ActionLink
                onClick={() => {
                  setGridSelectedKeys([]);
                  setGridSelectedRows([]);
                }}
              >
                清除选择
              </ActionLink>
            </div>
          ) : (
            <div className="text-xs text-gray-400">支持虚拟滚动、固定列、快捷点击选中</div>
          )}
        </div>
        <div className="mt-4 w-full h-[520px] grid grid-rows-[1fr]">
          <GridTable<Row>
            columns={gridColumns}
            data={gridRows}
            rowKey={(row) => row.id}
            loading={gridLoading}
            rowActions={gridRowActions}
            enableRowFocus
            showIndex
            selection={{
              // 关键：把示例页里已有的已选状态传进来
              selectedKeys: gridSelectedKeys,
              onChange: (keys, rows) => {
                setGridSelectedKeys(keys);
                setGridSelectedRows(rows);
              },

              // 交互偏好
              selectOnRowClick: true,       // 点击整行即可勾选/取消
              enableSelectAll: true,        // 表头全选
              headerTitle: '选择全部工单',
              columnWidth: 44,              // 选择列宽度
              // 如需控制可选行（比如禁用某些行），在这里返回 false 即可
              // isRowSelectable: (row) => true,
            }}
          />
        </div>
      </Card>
    </Layout>
  );
}
