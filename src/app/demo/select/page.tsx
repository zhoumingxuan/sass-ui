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
  const [multi, setMulti] = useState<string[]>(['t2', 't5']);

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

        <Card title="多选">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Input.Select multiple placeholder="请选择标签" options={tagOptions} clearable />
              </div>
              <div>
                <Input.Select
                  multiple
                  placeholder="请选择标签"
                  options={tagOptions}
                  value={multi}
                  onChange={(v) => Array.isArray(v) && setMulti(v)}
                  clearable
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">当前选择：{multi.length} 项</div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

