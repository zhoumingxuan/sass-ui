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
      <Card title="按钮尺寸与类型（Solid）">
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

      <Card title="描边（Outline）">
        <div className="flex flex-wrap gap-3">
          <Button appearance="outline" variant="primary">Primary</Button>
          <Button appearance="outline" variant="default">Default</Button>
          <Button appearance="outline" variant="success">Success</Button>
          <Button appearance="outline" variant="warning">Warning</Button>
          <Button appearance="outline" variant="error">Error</Button>
          <Button appearance="outline" variant="info">Info</Button>
        </div>
      </Card>

      <Card title="虚线（Dashed）">
        <div className="flex flex-wrap gap-3">
          <Button appearance="dashed" variant="primary">Primary</Button>
          <Button appearance="dashed" variant="default">Default</Button>
          <Button appearance="dashed" variant="success">Success</Button>
          <Button appearance="dashed" variant="warning">Warning</Button>
          <Button appearance="dashed" variant="error">Error</Button>
          <Button appearance="dashed" variant="info">Info</Button>
        </div>
      </Card>

      <Card title="链接（Link）">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-4 items-center">
            <Button appearance="link" size="large" variant="primary">大号链接</Button>
            <Button appearance="link" size="large" variant="default">大号链接</Button>
            <Button appearance="link" size="large" variant="error">大号删除</Button>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <Button appearance="link" size="medium" variant="primary">中号链接</Button>
            <Button appearance="link" size="medium" variant="default">中号链接</Button>
            <Button appearance="link" size="medium" variant="success" icon={<Check />}>带图标</Button>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <Button appearance="link" size="small" variant="primary">小号链接</Button>
            <Button appearance="link" size="small" variant="default">小号链接</Button>
            <Button appearance="link" size="small" variant="error">小号删除</Button>
          </div>
        </div>
      </Card>

      <Card title="幽灵（Ghost）">
        <div className="flex flex-wrap gap-3">
          <Button appearance="ghost" variant="primary">Primary</Button>
          <Button appearance="ghost" variant="default">Default</Button>
          <Button appearance="ghost" variant="success">Success</Button>
          <Button appearance="ghost" variant="warning">Warning</Button>
          <Button appearance="ghost" variant="error">Error</Button>
          <Button appearance="ghost" variant="info">Info</Button>
        </div>
      </Card>

      <Card title="块级（Block）">
        <div className="space-y-3 max-w-md">
          <Button block variant="primary">主要操作（Block）</Button>
          <Button block appearance="outline" variant="default">次要操作（Block Outline）</Button>
        </div>
      </Card>
    </Layout>
  );
}
