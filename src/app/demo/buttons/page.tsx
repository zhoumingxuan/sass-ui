'use client';

import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Plus, Search, Check, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { menuItems, footerItems } from '@/components/menuItems';

export default function ButtonsDemo() {
  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">按钮示例</div>}
    >
      <Card title="按钮尺寸与类型">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <Button size="large" variant="primary">大按钮</Button>
            <Button size="large" variant="default">大按钮</Button>
            <Button size="large" variant="success">大按钮</Button>
            <Button size="large" variant="warning">大按钮</Button>
            <Button size="large" variant="error">大按钮</Button>
            <Button size="large" variant="info">大按钮</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">中按钮</Button>
            <Button variant="default">中按钮</Button>
            <Button variant="success">中按钮</Button>
            <Button variant="warning">中按钮</Button>
            <Button variant="error">中按钮</Button>
            <Button variant="info">中按钮</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="small" variant="primary">小按钮</Button>
            <Button size="small" variant="default">小按钮</Button>
            <Button size="small" variant="success">小按钮</Button>
            <Button size="small" variant="warning">小按钮</Button>
            <Button size="small" variant="error">小按钮</Button>
            <Button size="small" variant="info">小按钮</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary" icon={<Plus />}>新增</Button>
            <Button variant="default" icon={<Search />}>搜索</Button>
            <Button variant="success" icon={<Check />}>提交</Button>
            <Button variant="warning" icon={<AlertTriangle />}>警告</Button>
            <Button variant="error" icon={<AlertTriangle />}>错误</Button>
            <Button variant="info" icon={<Info />}>信息</Button>
            <Button variant="primary" icon={<ArrowRight />} iconPosition="right">下一步</Button>
          </div>
        </div>
      </Card>
    </Layout>
  );
}

