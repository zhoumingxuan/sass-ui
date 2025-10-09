'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import { Input } from '@/components/Input';
import { menuItems, footerItems } from '@/components/menuItems';

const cityOptions = [
  { value: 'sh', label: '上海' },
  { value: 'bj', label: '北京' },
  { value: 'gz', label: '广州' },
  { value: 'sz', label: '深圳' },
  { value: 'hz', label: '杭州' },
  { value: 'cd', label: '成都' },
];

const tagOptions = [
  { value: 't1', label: '研发' },
  { value: 't2', label: '设计' },
  { value: 't3', label: '产品' },
  { value: 't4', label: '测试' },
  { value: 't5', label: '运营' },
  { value: 't6', label: '市场' },
  { value: 't7', label: '销售' },
  { value: 't8', label: '客服' },
  { value: 't9', label: '财务' },
  { value: 't10', label: '行政' },
  { value: 't11', label: '人事' },
  { value: 't12', label: '法务' },
];

export default function SelectDemo() {
  const [multiAuto, setMultiAuto] = useState<string[]>(['t1', 't2', 't3', 't4', 't5', 't6']);
  const [multiFixed, setMultiFixed] = useState<string[]>(['t1', 't2', 't3', 't4', 't5']);
  const [multiSummary, setMultiSummary] = useState<string[]>(['t2', 't5']);

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">选择器 Select</div>}
    >
      <div className="space-y-6">
        <Card title="单选">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Input.Select placeholder="请选择城市" options={cityOptions} size="sm" clearable />
            </div>
            <div>
              <Input.Select placeholder="请选择城市" options={cityOptions} size="md" />
            </div>
            <div>
              <Input.Select placeholder="请选择城市" options={cityOptions} size="lg" required />
            </div>
          </div>
        </Card>

        <Card title="多选 · 自适应 maxTagCount（不传该属性，按宽度自动）">
          <div className="space-y-2">
            <Input.Select
              multiple
              placeholder="请选择标签"
              options={tagOptions}
              value={multiAuto}
              onChange={(v) => Array.isArray(v) && setMultiAuto(v)}
              clearable
              // 不传 maxTagCount -> 按宽度自适应计算
            />
            <div className="text-sm text-gray-600">当前选择：{multiAuto.length} 项（你可以缩放窗口或改变容器宽度观察 +N 的变化）</div>
          </div>
        </Card>

        <Card title="多选 · 固定 maxTagCount=2（其余用 +N）">
          <div className="space-y-2">
            <Input.Select
              multiple
              placeholder="请选择标签"
              options={tagOptions}
              value={multiFixed}
              onChange={(v) => Array.isArray(v) && setMultiFixed(v)}
              clearable
              maxTagCount={2}
              pillCloseable
            />
            <div className="text-sm text-gray-600">当前选择：{multiFixed.length} 项</div>
          </div>
        </Card>

        <Card title="多选 · 汇总为一颗 primary Pill（提示“已选X项”）">
          <div className="space-y-2">
            <Input.Select
              multiple
              placeholder="请选择标签"
              options={tagOptions}
              value={multiSummary}
              onChange={(v) => Array.isArray(v) && setMultiSummary(v)}
              clearable
              showSelectedSummary
              // 也可自定义汇总文案：
              // summaryText={(n) => `共选择 ${n} 项`}
            />
            <div className="text-sm text-gray-600">当前选择：{multiSummary.length} 项</div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
