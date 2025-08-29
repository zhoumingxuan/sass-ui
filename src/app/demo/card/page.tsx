'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { menuItems, footerItems } from '@/components/menuItems';

export default function CardDemo() {
  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">卡片示例</div>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="基本卡片">这是卡片内容区域。</Card>
        <Card title="带操作的卡片" closable onClose={() => alert('close')}>可关闭的卡片内容。</Card>
        <Card>
          <div className="text-gray-700">无标题卡片，纯内容布局。</div>
        </Card>
        <Card title="组合">
          <div className="flex gap-3">
            <Button>主要操作</Button>
            <Button appearance="outline" variant="default">次要操作</Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
