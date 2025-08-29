'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { TextInput, NumberInput, PasswordInput, SelectInput, DateInput, DateRangeInput } from '@/components/Input';
import { useState } from 'react';
import { menuItems, footerItems } from '@/components/menuItems';

export default function FormDemo() {
  const [submitting, setSubmitting] = useState(false);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 1000);
  };
  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">表单示例</div>}
    >
      <Card title="输入控件">
        <form className="grid grid-cols-12 gap-4 md:gap-6" onSubmit={onSubmit}>
          <div className="col-span-12 md:col-span-6"><TextInput label="文本输入" placeholder="请输入文本" /></div>
          <div className="col-span-12 md:col-span-6"><NumberInput label="数字输入" placeholder="请输入数字" /></div>
          <div className="col-span-12 md:col-span-6"><PasswordInput label="密码输入" placeholder="请输入密码" /></div>
          <div className="col-span-12 md:col-span-6">
            <SelectInput label="选择输入" options={[{ value: '', label: '请选择' }, { value: '1', label: '选项1' }]} />
          </div>
          <div className="col-span-12 md:col-span-6"><DateInput label="日期输入" /></div>
          <div className="col-span-12 md:col-span-6"><DateRangeInput label="日期范围" /></div>
          <div className="col-span-12">
            <Button type="submit" disabled={submitting}>{submitting ? '提交中...' : '提交'}</Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}

