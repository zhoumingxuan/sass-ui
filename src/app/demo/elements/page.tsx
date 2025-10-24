'use client';

import type { JSX } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Pill from '@/components/Pill';
import ProgressBar from '@/components/ProgressBar';
import ActionLink from '@/components/ActionLink';
import Button from '@/components/Button';
import { menuItems, footerItems } from '@/components/menuItems';
import { Info, CheckCircle2, AlertTriangle, Link as LinkIcon } from 'lucide-react';

const pillTones: Array<{ tone: Parameters<typeof Pill>[0]['tone']; label: string; icon?: JSX.Element }> = [
  { tone: 'neutral', label: '中性' },
  { tone: 'primary', label: '主语义', icon: <Info size={12} /> },
  { tone: 'success', label: '成功', icon: <CheckCircle2 size={12} /> },
  { tone: 'warning', label: '警告', icon: <AlertTriangle size={12} /> },
  { tone: 'danger', label: '危险' },
  { tone: 'info', label: '信息' },
];

export default function ElementsDemo() {
  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800 ">界面元素</div>}
    >
      <div>
        <Card title="状态标签 Pill" className='mb-3'>
          <div className="flex flex-wrap gap-3">
            {pillTones.map((item) => (
              <Pill key={item.tone} tone={item.tone} icon={item.icon}>
                {item.label}
              </Pill>
            ))}
          </div>
        </Card>

        <Card title="进度 ProgressBar" className='mb-3'>
          <div className="space-y-4">
            <ProgressBar value={35} showValue tone="primary" className="max-w-xs" />
            <ProgressBar value={72} showValue tone="info" className="max-w-xs" />
            <ProgressBar value={100} showValue tone="success" className="max-w-xs" />
          </div>
        </Card>

        <Card title="操作链接 ActionLink">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ActionLink tone="primary">立即处理</ActionLink>
              <ActionLink>查看详情</ActionLink>
              <ActionLink className="inline-flex items-center gap-1 text-gray-500">
                <LinkIcon size={14} />
                下载附件
              </ActionLink>
            </div>
            <p className="text-xs text-gray-500">
              统一的弱按钮形式，让工具栏与表格操作列保持轻量，同时具备清晰的焦点环与 hover/active 反馈。
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-4">
              <CheckCircle2 className="text-success" size={18} />
              <div className="flex-1 text-sm text-gray-600">
                推荐搭配主按钮使用，例如主操作使用 <Button size="small" variant="primary">提交</Button>，辅助操作用 ActionLink 承载。
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
              <AlertTriangle size={16} />
              对于“撤销”“更多设置”这类弱化动作，ActionLink 可以降低视觉噪音，避免与主色按钮争抢注意力。
            </div>
          </div>
        </Card>
      </div>


    </Layout>
  );
}