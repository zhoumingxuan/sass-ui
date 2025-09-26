'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import StepsPanel, { StepGroup } from '@/components/StepsPanel';
import GridTable, { GridColumn } from '@/components/GridTable';
import Pill from '@/components/Pill';
import { menuItems, footerItems } from '@/components/menuItems';
import { Play, RefreshCw, FileQuestion } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Task = {
  id: number;
  item: string;
  node: string;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  lastRun?: string;
  note?: string;
  stepKey: string;
};

const STATUS_TEXT: Record<Task['status'], string> = {
  pending: '待执行',
  running: '执行中',
  success: '已通过',
  error: '错误',
};
const STATUS_TONE: Record<Task['status'], Parameters<typeof Pill>[0]['tone']> = {
  pending: 'neutral',
  running: 'info',
  success: 'success',
  error: 'danger',
};

export default function RunbookDemo() {
  const groups: StepGroup[] = [
    {
      key: 'before',
      title: '开市前',
      items: [
        { key: 'prep', title: '系统环境准备', description: '网络/服务/权限巡检', status: 'done', meta: <Pill tone="success">已执行</Pill> },
        { key: 'fetch', title: 'REM DC 数据获取', description: '同步 REM/DC 指标数据', status: 'done', meta: <Pill tone="success">已执行</Pill> },
        { key: 'start', title: '启动系统', description: '启动业务进程与监听', status: 'active', meta: <Pill tone="primary">进行中</Pill> },
      ],
    },
    {
      key: 'after',
      title: '闭市后',
      items: [
        { key: 'shutdown', title: '停止系统', description: '优雅关闭服务', status: 'pending', meta: <Pill>未执行</Pill> },
        { key: 'archive', title: '数据归档', description: '备份并清理历史', status: 'disabled', meta: <Pill>未执行</Pill> },
        { key: 'init', title: '系统初始化', description: '重置参数/建库', status: 'disabled', meta: <Pill>未执行</Pill> },
      ],
    },
  ];

  const [active, setActive] = useState('start');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [serverMode, setServerMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const tasks: Task[] = [
    { id: 1, item: '检测核心服务', node: 'app-01', status: 'success', duration: 3, lastRun: '2025-09-26 09:15', stepKey: 'start' },
    { id: 2, item: '加载基础配置', node: 'app-01', status: 'success', duration: 1, lastRun: '2025-09-26 09:15', stepKey: 'start' },
    { id: 3, item: '启动监听端口', node: 'app-01', status: 'running', note: '等待健康检查', stepKey: 'start' },
  ];

  

  const columns: GridColumn<Task>[] = [
      { key: 'item', title: '执行项',styles:{minWidth:220}},
      { key: 'node', title: '节点', width: 140 },
      {
        key: 'status',
        title: '执行状态',
        width: 120,
        intent: 'status',
        render: (row) => <Pill tone={STATUS_TONE[row.status]}>{STATUS_TEXT[row.status]}</Pill>,
      },
      { key: 'duration', title: '用时(s)', align: 'right', width: 120, semantic: 'number' },
      { key: 'lastRun', title: '上次执行时间', width: 180, semantic: 'datetime' },
      { key: 'note', title: '描述' },
    ];

  const columnsWithSort: GridColumn<Task>[] = useMemo(() => {
    const allowed = new Set<keyof Task>(['item', 'node', 'status', 'duration', 'lastRun']);
    return columns.map((c) => (allowed.has(c.key as keyof Task) ? { ...c, sortable: true } : c));
  }, []);

  const sortableFields: Array<keyof Task> = ['item', 'node', 'status', 'duration', 'lastRun'];
  const handleSortChange = async (sorts: Array<{ key: GridColumn<Task>["key"]; direction: 'asc' | 'desc' }>) => {
    if (!serverMode || sorts.length === 0) return;
    setLoading(true);
    const collator = typeof Intl !== 'undefined' ? new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' }) : null;
    const sorted = [...serverData].sort((a, b) => {
      for (const s of sorts) {
        const k = s.key as keyof Task;
        if (!sortableFields.includes(k)) continue;
        const av = (a as any)[k];
        const bv = (b as any)[k];
        if (av == null && bv == null) continue;
        if (av == null) return s.direction === 'asc' ? -1 : 1;
        if (bv == null) return s.direction === 'asc' ? 1 : -1;
        if (typeof av === 'number' && typeof bv === 'number') { const r = av - bv; if (r !== 0) return s.direction === 'asc' ? r : -r; continue; }
        const as = String(av); const bs = String(bv);
        const r = collator ? collator.compare(as, bs) : as.localeCompare(bs);
        if (r !== 0) return s.direction === 'asc' ? r : -r;
      }
      return 0;
    });
    await new Promise((r) => setTimeout(r, 200));
    setServerData(sorted);
    setLoading(false);
  };

  const scopedBase = useMemo(() => tasks.filter((t) => t.stepKey === active), [active]);
  const [serverData, setServerData] = useState<Task[]>(scopedBase);
  useEffect(() => { setServerData(scopedBase); }, [scopedBase]);
  const total = (serverMode ? serverData : scopedBase).length;
  const pass = (serverMode ? serverData : scopedBase).filter((t) => t.status === 'success').length;
  const fail = (serverMode ? serverData : scopedBase).filter((t) => t.status === 'error').length;
  const StatsBar = (
    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
      <div>当前步骤: <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">{active}</span></div>
      <div>总计 <span className="tabular-nums font-semibold">{total}</span></div>
      <div className="text-success">通过 <span className="tabular-nums font-semibold">{pass}</span></div>
      <div className="text-error">错误 <span className="tabular-nums font-semibold">{fail}</span></div>
    </div>
  );

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">日常运维 / 运维流程 / 系统环境准备</div>}
    >
      <div className="grid grid-cols-[280px_1fr] gap-5">
        <StepsPanel
          groups={groups}
          activeKey={active}
          onChange={(k) => setActive(String(k))}
          className="sticky top-4 h-fit"
        />

        <div className="space-y-4">
          <Card title="执行项">
            <div className="flex items-center justify-between mb-3">
              {StatsBar}
              <div className="flex items-center gap-3">
                <Button icon={<Play className="h-4 w-4" />} size="small">执行</Button>
                <Button variant="default" icon={<RefreshCw className="h-4 w-4" />} size="small">刷新</Button>
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  <input type="checkbox" checked={serverMode} onChange={(e) => setServerMode(e.target.checked)} />
                  服务端排序
                </label>
              </div>
            </div>
            <GridTable
              columns={columnsWithSort}
              data={serverMode ? serverData : scopedBase}
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              loading={serverMode ? loading : false}
              onSortChange={handleSortChange}
              serverSideSort={serverMode}
              zebra
              showIndex
              rowKey={(r) => r.id}
            />
          </Card>

          <Card title="执行步骤" className='h-[600px]'>
            <div className="flex items-center justify-between mb-3">
              {StatsBar}
              <div className="flex items-center gap-2">
                <Button icon={<Play className="h-4 w-4" />} size="small">执行</Button>
                <Button variant="default" icon={<RefreshCw className="h-4 w-4" />} size="small">刷新</Button>
              </div>
            </div>
            <GridTable
              columns={[
                { key: 'ts', title: '发生时间', width: 180 },
                { key: 'item', title: '执行项'},
                { key: 'level', title: '级别', width: 120 },
                { key: 'desc', title: '描述' },
              ]}
              data={[]}
              page={1}
              className={"h-full"}
              pageSize={10}
              onPageChange={() => {}}
              showIndex
            />
          </Card>
        </div>
      </div>
    </Layout>
  );
}
