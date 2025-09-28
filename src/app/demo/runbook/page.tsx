'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import StepsPanel, { StepGroup } from '@/components/StepsPanel';
import GridTable, { GridColumn } from '@/components/GridTable';
import Pill from '@/components/Pill';
import { menuItems, footerItems } from '@/components/menuItems';
import { Play, RefreshCw,RotateCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/Input';

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
        { key: 'shutdown', title: '停止系统', description: '优雅关闭服务', status: 'disabled', meta: <Pill>未执行</Pill> },
        { key: 'archive', title: '数据归档', description: '备份并清理历史', status: 'disabled', meta: <Pill>未执行</Pill> },
        { key: 'init', title: '系统初始化', description: '重置参数/建库', status: 'disabled', meta: <Pill>未执行</Pill> },
      ],
    },
  ];
  // 默认从“开市前/启动系统”开始，可按需手动切换
  const [active, setActive] = useState<string>('start');
  

  const tasks: Task[] = [
    { id: 1, item: '检测核心服务', node: 'app-01', status: 'success', duration: 3, lastRun: '2025-09-26 09:15', stepKey: 'start' },
    { id: 2, item: '加载基础配置', node: 'app-01', status: 'success', duration: 1, lastRun: '2025-09-26 09:15', stepKey: 'start' },
    { id: 3, item: '启动监听端口', node: 'app-01', status: 'running', note: '等待健康检查', stepKey: 'start' },
  ];

  // 执行步骤日志（仅演示用途）
  type Log = { id: number; ts: string; item: string; level: 'info' | 'warn' | 'error'; desc: string; stepKey: string };
  const logs: Log[] = [
    { id: 1, ts: '2025-09-26 09:24:19', item: '检测核心服务', level: 'info',  desc: 'START', stepKey: 'start' },
    { id: 2, ts: '2025-09-26 09:24:20', item: '检测核心服务', level: 'info',  desc: 'SUCC',  stepKey: 'start' },
    { id: 3, ts: '2025-09-26 09:24:20', item: '加载基础配置', level: 'info',  desc: 'START', stepKey: 'start' },
    { id: 4, ts: '2025-09-26 09:24:21', item: '加载基础配置', level: 'info',  desc: 'SUCC',  stepKey: 'start' },
    { id: 5, ts: '2025-09-26 09:24:21', item: '启动监听端口', level: 'info',  desc: 'START', stepKey: 'start' },
    { id: 6, ts: '2025-09-26 09:24:23', item: '启动监听端口', level: 'warn',  desc: '等待健康检查', stepKey: 'start' },
  ];

  // “执行步骤”筛选条件
  const [logLevel, setLogLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [logItem, setLogItem] = useState<string>('all');
  const [logQuery, setLogQuery] = useState('');


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
    const base = columns.map((c) => (allowed.has(c.key as keyof Task) ? { ...c, sortable: true } : c));
    return base.map((c) => {
      const { width, ...rest } = c as any;
      const styles = (c as any).styles ? { ...(c as any).styles } : undefined;
      if (styles && Object.prototype.hasOwnProperty.call(styles, 'minWidth')) delete (styles as any).minWidth;
      return styles ? { ...rest, styles } : rest;
    });
  }, []);

  

  const scopedBase = useMemo(() => tasks.filter((t) => t.stepKey === active), [active]);
  const total = scopedBase.length;
  const pass = scopedBase.filter((t) => t.status === 'success').length;
  const fail = scopedBase.filter((t) => t.status === 'error').length;

  // 按当前步骤切片日志并应用筛选
  const scopedLogs = useMemo(() => logs.filter((l) => l.stepKey === active), [logs, active]);
  const itemOptions = useMemo(() => {
    const set = new Set(scopedLogs.map(l => l.item));
    return ['all', ...Array.from(set)];
  }, [scopedLogs]);
  const filteredLogs = useMemo(() => {
    const q = logQuery.trim().toLowerCase();
    return scopedLogs.filter((l) => {
      if (logLevel !== 'all' && l.level !== logLevel) return false;
      if (logItem !== 'all' && l.item !== logItem) return false;
      if (q && !(l.item.toLowerCase().includes(q) || l.desc.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [scopedLogs, logLevel, logItem, logQuery]);

  // 当前执行步骤状态（不显示步骤编码）
  const stepStatusText: Record<string, string> = {
    pending: '待执行',
    active: '进行中',
    done: '已通过',
    error: '错误',
    disabled: '未执行',
  };
  const stepStatusTone: Record<string, Parameters<typeof Pill>[0]['tone']> = {
    pending: 'neutral',
    active: 'primary',
    done: 'success',
    error: 'danger',
    disabled: 'neutral',
  };
  const activeStepStatus = useMemo(() => {
    const item = groups.flatMap((g) => g.items).find((it) => String(it.key) === String(active));
    return (item?.status ?? 'pending') as keyof typeof stepStatusText;
  }, [active]);

  const StatsBar = (
    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
      <div className="flex items-center gap-2">
        <span>当前步骤状态</span>
        <Pill tone={stepStatusTone[activeStepStatus]}>{stepStatusText[activeStepStatus]}</Pill>
      </div>
      <div>总计 <span className="tabular-nums font-semibold">{total}</span></div>
      <div className="text-success">通过 <span className="tabular-nums font-semibold">{pass}</span></div>
      <div className="text-error">错误 <span className="tabular-nums font-semibold">{fail}</span></div>
    </div>
  );

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">日常运维流程</div>}
    >
      <div className="grid grid-cols-[auto_1fr_auto] h-full gap-5 items-start">
        {/* 开市（左侧） */}
        <StepsPanel
          groups={groups.filter((g) => g.key === 'before')}
          activeKey={active}
          onChange={(k) => setActive(String(k))}
          className="sticky top-0 self-start h-fit"
        />

        {/* 中部：执行项 + 执行步骤（等分） */}
        <div className="grid grid-rows-2 gap-4 h-full">
          <Card title="执行项">
            <div className="flex items-center justify-between mb-3 shrink-0">
              {StatsBar}
              <div className="flex items-center gap-2">
                <Button icon={<Play className="h-4 w-4" />} size="small">执行</Button>
                <Button variant="default" icon={<RefreshCw className="h-4 w-4" />} size="small">刷新</Button>
              </div>
            </div>
            <GridTable
              columns={columnsWithSort}
              data={scopedBase}
              zebra
              showIndex
              rowKey={(r) => r.id}
              className="flex-1 min-h-0"
            />
          </Card>

          <Card title="执行步骤">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="w-36">
                <Input.Select
                  size='sm'
                  value={logLevel}
                  onChange={(v) => setLogLevel((v as any) || 'all')}
                  options={[
                    { value: 'all', label: '全部级别' },
                    { value: 'info', label: 'info' },
                    { value: 'warn', label: 'warn' },
                    { value: 'error', label: 'error' },
                  ]}
                />
              </div>
              <div className="min-w-[18rem]">
                <Input.Text
                  size='sm'
                  placeholder="关键字：执行项/描述"
                  value={logQuery}
                  onChange={(e) => setLogQuery((e.target as HTMLInputElement).value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="default" icon={<RotateCw className="h-4 w-4" />} size="small">重置</Button>
              </div>
            </div>
            <GridTable
              columns={[
                { key: 'ts', title: '发生时间' },
                { key: 'item', title: '执行项'},
                { key: 'level', title: '级别' },
                { key: 'desc', title: '描述' },
              ]}
              data={filteredLogs}
              className="flex-1 min-h-0"
              showIndex
            />
          </Card>
        </div>

        {/* 闭市（右侧） */}
        <StepsPanel
          groups={groups.filter((g) => g.key === 'after')}
          activeKey={active}
          baseIndex={groups.find((g) => g.key === 'before')?.items.length}
          onChange={(k) => setActive(String(k))}
          className="sticky top-0 self-start h-fit"
        />
      </div>
    </Layout>
  );
}
