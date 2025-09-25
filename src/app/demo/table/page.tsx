'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import GridTable, { GridColumn, RowActionsConfig } from '@/components/GridTable';
import Button from '@/components/Button';
import Pill from '@/components/Pill';
import ProgressBar from '@/components/ProgressBar';
import { menuItems, footerItems } from '@/components/menuItems';
import { Plus, Filter, RefreshCw } from 'lucide-react';

/** ====== 行数据结构 ====== */
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
  startAt: string;     // YYYY-MM-DD
  endAt: string;       // YYYY-MM-DD
  lastUpdated: string; // ISOString
  risk: 'low' | 'medium' | 'high';
};

/** ====== Tone 联合类型（与 Pill 保持一致的值集合）====== */
type Tone = 'neutral' | 'primary' | 'info' | 'warning' | 'success' | 'danger';

/** ====== 辅助元数据 ====== */
const STATUS_META: Record<Row['status'], { label: string; tone: Tone }> = {
  planning: { label: '规划中', tone: 'neutral' },
  design: { label: '方案设计', tone: 'primary' },
  developing: { label: '研发中', tone: 'info' },
  review: { label: '验收中', tone: 'warning' },
  launched: { label: '已上线', tone: 'success' },
};
const PRIORITY_META: Record<Row['priority'], { label: string; tone: Tone }> = {
  low: { label: '常规', tone: 'neutral' },
  medium: { label: '较高', tone: 'primary' },
  high: { label: '高', tone: 'warning' },
  urgent: { label: '紧急', tone: 'danger' },
};
const RISK_META: Record<Row['risk'], { label: string; tone: Tone }> = {
  low: { label: '低', tone: 'success' },
  medium: { label: '中', tone: 'warning' },
  high: { label: '高', tone: 'danger' },
};

const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

/** ====== 基础样例数据（10 条）====== */
const BASE: Row[] = [
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
    progress: 43,
    completedTasks: 22,
    totalTasks: 50,
    budgetPlanned: 330000,
    budgetUsed: 99000,
    startAt: '2025-03-20',
    endAt: '2025-10-18',
    lastUpdated: '2025-09-14T16:05:00+08:00',
    risk: 'low',
  },
  {
    id: 'PRJ-003',
    project: 'BI 仪表盘重构',
    owner: '张敏',
    team: '数据平台',
    status: 'planning',
    priority: 'high',
    progress: 19,
    completedTasks: 10,
    totalTasks: 50,
    budgetPlanned: 340000,
    budgetUsed: 132000,
    startAt: '2025-02-01',
    endAt: '2025-12-15',
    lastUpdated: '2025-09-10T11:00:00+08:00',
    risk: 'low',
  },
  {
    id: 'PRJ-004',
    project: '客服机器人 2.0',
    owner: '陈伟',
    team: '智能服务',
    status: 'review',
    priority: 'urgent',
    progress: 30,
    completedTasks: 15,
    totalTasks: 50,
    budgetPlanned: 350000,
    budgetUsed: 225500,
    startAt: '2025-04-10',
    endAt: '2025-12-31',
    lastUpdated: '2025-09-18T11:35:00+08:00',
    risk: 'medium',
  },
  {
    id: 'PRJ-005',
    project: '移动端性能优化',
    owner: '韩雪',
    team: '客户端',
    status: 'developing',
    priority: 'low',
    progress: 82,
    completedTasks: 41,
    totalTasks: 50,
    budgetPlanned: 160000,
    budgetUsed: 82500,
    startAt: '2025-05-02',
    endAt: '2025-11-02',
    lastUpdated: '2025-09-13T19:12:00+08:00',
    risk: 'low',
  },
  {
    id: 'PRJ-006',
    project: '国际化落地',
    owner: '李博',
    team: '国际化',
    status: 'planning',
    priority: 'medium',
    progress: 59,
    completedTasks: 30,
    totalTasks: 50,
    budgetPlanned: 300000,
    budgetUsed: 143000,
    startAt: '2025-01-10',
    endAt: '2025-10-10',
    lastUpdated: '2025-09-17T21:45:00+08:00',
    risk: 'low',
  },
  {
    id: 'PRJ-007',
    project: '安全审计体系',
    owner: '周楠',
    team: '安全',
    status: 'design',
    priority: 'high',
    progress: 17,
    completedTasks: 9,
    totalTasks: 50,
    budgetPlanned: 280000,
    budgetUsed: 193700,
    startAt: '2025-06-01',
    endAt: '2025-12-01',
    lastUpdated: '2025-08-29T05:22:00+08:00',
    risk: 'medium',
  },
  {
    id: 'PRJ-008',
    project: '企业门户改版',
    owner: '赵婧',
    team: '前端',
    status: 'review',
    priority: 'urgent',
    progress: 48,
    completedTasks: 24,
    totalTasks: 50,
    budgetPlanned: 320000,
    budgetUsed: 163900,
    startAt: '2025-03-18',
    endAt: '2025-10-28',
    lastUpdated: '2025-09-15T14:05:00+08:00',
    risk: 'low',
  },
  {
    id: 'PRJ-009',
    project: '供应链可视化',
    owner: '孙雷',
    team: '供应链',
    status: 'developing',
    priority: 'medium',
    progress: 98,
    completedTasks: 49,
    totalTasks: 50,
    budgetPlanned: 240000,
    budgetUsed: 151250,
    startAt: '2025-04-05',
    endAt: '2025-11-25',
    lastUpdated: '2025-09-16T02:05:00+08:00',
    risk: 'low',
  },
  {
    id: 'PRJ-010',
    project: '实时监控体系',
    owner: '袁晨',
    team: '平台',
    status: 'design',
    priority: 'medium',
    progress: 30,
    completedTasks: 15,
    totalTasks: 50,
    budgetPlanned: 320000,
    budgetUsed: 209000,
    startAt: '2025-07-01',
    endAt: '2025-12-31',
    lastUpdated: '2025-09-17T08:10:00+08:00',
    risk: 'medium',
  },
];

/** ====== 扩容为海量数据（用于虚拟滚动）====== */
function buildVirtual(rows: Row[], multiplier = 60): Row[] {
  const statuses: Row['status'][] = ['planning', 'design', 'developing', 'review', 'launched'];
  const priorities: Row['priority'][] = ['low', 'medium', 'high', 'urgent'];
  const risks: Row['risk'][] = ['low', 'medium', 'high'];
  const items: Row[] = [];
  const baseSize = rows.length;
  for (let i = 0; i < baseSize * multiplier; i += 1) {
    const src = rows[i % baseSize];
    const batch = Math.floor(i / baseSize);
    const variant = i % baseSize;
    const id = `${src.id}-G${(batch + 1).toString().padStart(2, '0')}-${(variant + 1).toString().padStart(2, '0')}`;
    const status = statuses[(batch + variant) % statuses.length];
    const priority = priorities[(variant + batch * 2) % priorities.length];
    const risk = risks[(batch + variant * 3) % risks.length];
    const progressSeed = (src.progress + batch * 11 + variant * 7) % 101;
    const progress = progressSeed === 0 ? 5 : progressSeed;
    const usageRatio = Math.min(1.25, 0.55 + ((batch % 12) * 0.05));
    const budgetUsed = Math.round(src.budgetPlanned * usageRatio);
    const startAtDate = new Date(src.startAt); startAtDate.setDate(startAtDate.getDate() + batch * 2);
    const endAtDate = new Date(src.endAt); endAtDate.setDate(endAtDate.getDate() + batch * 2 + (variant % 5));
    const updatedAt = new Date(src.lastUpdated); updatedAt.setHours(updatedAt.getHours() + batch * 6 + (variant % 3));
    items.push({
      ...src,
      id,
      project: `${src.project} · 第${batch + 1}批`,
      status, priority, risk, progress,
      completedTasks: Math.min(src.totalTasks, Math.max(0, Math.round((progress / 100) * src.totalTasks))),
      budgetUsed,
      startAt: startAtDate.toISOString().slice(0, 10),
      endAt: endAtDate.toISOString().slice(0, 10),
      lastUpdated: updatedAt.toISOString(),
    });
  }
  return items;
}

/** ====== GridTable 列 ====== */
const columns: GridColumn<Row>[] = [
  { key: 'id', title: '编号', fixed: 'left', align:'left' },
  { key: 'project', title: '项目' },
  { key: 'owner', title: '负责人' },
  {
    key: 'priority',
    title: '优先级',
    semantic: 'text',
    render: (row) => <Pill tone={PRIORITY_META[row.priority].tone}>{PRIORITY_META[row.priority].label}</Pill>,
  },
  {
    key: 'progress',
    title: '进度',
    width: 200,
    semantic: 'text',
    render: (row) => (
      <div className="flex h-full items-center justify-center gap-3">
        <ProgressBar value={row.progress} showValue className="w-32" tone={row.progress >= 80 ? 'success' : 'primary'} />
      </div>
    ),
  },
  {
    key: 'budgetUsed',
    title: '已使用预算',
    semantic: 'number',
    render: (row) => <span>{currency.format(row.budgetUsed)}</span>,
  },
  {
    key: 'lastUpdated',
    title: '最新更新时间',
    semantic: 'datetime',
    render: (row) => dateTime.format(new Date(row.lastUpdated)),
  },
  {
    key: 'risk',
    title: '风险',
    semantic: 'text',
    render: (row) => <Pill tone={RISK_META[row.risk].tone}>{RISK_META[row.risk].label}</Pill>,
  },
];

/** ====== 页面组件 ====== */
export default function GridTableDemoPage() {
  /** —— 示例 1：分页（父层切片） —— */
  const virtual = useMemo(() => buildVirtual(BASE, 60), []);
  const [rows, setRows] = useState<Row[]>(virtual);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([]);
  const [selectedRows, setSelectedRows] = useState<Row[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const total = rows.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paged = rows.slice(start, end);

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
    if (page > pages) setPage(pages);
  }, [total, page, pageSize]);

  useEffect(() => {
    // 清理已被删除的数据对应的选择
    if (rows.length === 0) {
      setSelectedKeys([]);
      setSelectedRows([]);
      return;
    }
    setSelectedKeys((keys) => keys.filter((k) => rows.some((r) => r.id === k)));
    setSelectedRows((rs) => rs.filter((r) => rows.some((x) => x.id === r.id)));
  }, [rows]);

  const refresh = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setLoading(true);
    timerRef.current = setTimeout(() => {
      setRows((list) =>
        list.map((row, idx) => {
          if (idx % 37 !== 0) return row;
          const drift = Math.max(-0.08, Math.min(0.12, (Math.random() - 0.5) * 0.2));
          const progress = Math.min(100, Math.max(0, row.progress + Math.round(drift * 100)));
          const budgetRatio = Math.min(1.2, Math.max(0.35, row.budgetUsed / row.budgetPlanned + drift * 0.6));
          const budgetUsed = Math.round(row.budgetPlanned * budgetRatio);
          const completedTasks = Math.min(row.totalTasks, Math.max(0, Math.round((progress / 100) * row.totalTasks)));
          return { ...row, progress, completedTasks, budgetUsed, lastUpdated: new Date().toISOString() };
        }),
      );
      setLoading(false);
      timerRef.current = null;
    }, 680);
  };
  const clearAll = () => {
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    setLoading(false);
    setRows([]);
    setSelectedKeys([]);
    setSelectedRows([]);
    setPage(1);
  };
  const resetAll = () => {
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    setLoading(false);
    setRows(virtual);
    setSelectedKeys([]);
    setSelectedRows([]);
    setPage(1);
  };

  const rowActions: RowActionsConfig<Row> = useMemo(
    () => ({
      title: '操作',
      getActions: (row) => [
        { key: 'detail', label: '详情', onClick: () => console.log('detail', row.id) },
        row.status === 'launched'
          ? { key: 'archive', label: '归档', onClick: () => console.log('archive', row.id) }
          : { key: 'promote', label: '推进', onClick: () => console.log('promote', row.id) },
      ],
    }),
    [],
  );

  /** —— 示例 2：虚拟滚动（不分页） —— */
  const heavy = useMemo(() => buildVirtual(BASE, 120), []);
  const [heavyRows] = useState<Row[]>(heavy);

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">表格示例（GridTable）</div>}
    >
      {/* === 分页示例 === */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button icon={<Plus className="h-4 w-4" />} size="small">新建</Button>
            <Button icon={<Filter className="h-4 w-4" />} appearance="ghost" variant="default" size="small">筛选</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button icon={<RefreshCw className="h-4 w-4" />} onClick={refresh} appearance="ghost" variant="default" size="small">批量刷新</Button>
            <Button onClick={clearAll} appearance="ghost" variant="default" size="small">清空数据</Button>
            <Button onClick={resetAll} appearance="ghost" variant="default" size="small">恢复数据</Button>
          </div>
        </div>

        <div className="mt-4 w-full h-[520px] grid grid-rows-[1fr]">
          <GridTable<Row>
            columns={columns}
            data={paged}
            rowKey={(row) => row.id}
            loading={loading}
            showIndex
            enableRowFocus
            rowActions={rowActions}
            selection={{
              selectedKeys,
              onChange: (keys, rows) => {
                setSelectedKeys(keys);
                setSelectedRows(rows);
              },
              selectOnRowClick: true,
              enableSelectAll: true,
              headerTitle: '选择全部',
              columnWidth: 44,
            }}
            // —— 分页控制（GridTable 仅展示条，不切片数据）
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setPage(p)}
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            paginationKeyboard
            showTotal
          />
        </div>

        {/* 轻提示：不干扰主要视线 */}
        {selectedRows.length > 0 && (
          <div className="mt-2 text-sm text-primary">已选择 {selectedRows.length} 项</div>
        )}
      </Card>

      {/* === 虚拟滚动示例（不分页） === */}
      <Card className="mt-6">
        <div className="mb-2 text-sm text-gray-600">虚拟滚动 · 海量数据（不分页，仅滚动）：</div>
        <div className="w-full h-[520px] grid grid-rows-[1fr]">
          <GridTable<Row>
            columns={columns}
            data={heavyRows}
            rowKey={(row) => row.id}
            showIndex
            enableRowFocus
            rowActions={rowActions}
            // 不传分页 props，即为纯虚拟滚动
          />
        </div>
      </Card>
    </Layout>
  );
}
