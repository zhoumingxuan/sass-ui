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
  const [multiA, setMultiA] = useState<string[]>(['t2', 't5']);
  const [multiB, setMultiB] = useState<string[]>(['t1', 't2', 't3', 't4']);
  const [multiC, setMultiC] = useState<string[]>(['t6', 't7', 't8']);

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

        <Card title="多选 · 汇总为一颗 primary Pill（提示“已选X项”）">
          <div className="space-y-2">
            <Input.Select
              multiple
              placeholder="请选择标签"
              options={tagOptions}
              value={multiA}
              onChange={(v) => Array.isArray(v) && setMultiA(v)}
              clearable
              showSelectedSummary
              // 也可自定义汇总文案：
              // summaryText={(n) => `共选择 ${n} 项`}
            />
            <div className="text-sm text-gray-600">当前选择：{multiA.length} 项</div>
          </div>
        </Card>

        <Card title="多选 · 展示最多2颗 + 余量用 +N 的 primary Pill">
          <div className="space-y-2">
            <Input.Select
              multiple
              placeholder="请选择标签"
              options={tagOptions}
              value={multiB}
              onChange={(v) => Array.isArray(v) && setMultiB(v)}
              clearable
              maxTagCount={2}
              selectedPillTone="neutral"   // 单条 Pill 用中性
              pillCloseable                 // 在 Pill 内关闭
            />
            <div className="text-sm text-gray-600">当前选择：{multiB.length} 项</div>
          </div>
        </Card>

        <Card title="多选 · 单条 Pill 改为 primary 语气（验证 X 跟随 tone）">
          <div className="space-y-2">
            <Input.Select
              multiple
              placeholder="请选择标签"
              options={tagOptions}
              value={multiC}
              onChange={(v) => Array.isArray(v) && setMultiC(v)}
              clearable
              maxTagCount={3}
              selectedPillTone="primary"   // 单条 Pill 用 primary；X 也会是 primary 风格
              pillCloseable
            />
            <div className="text-sm text-gray-600">当前选择：{multiC.length} 项</div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
