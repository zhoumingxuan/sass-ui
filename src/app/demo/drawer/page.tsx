'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Drawer from '@/components/Drawer';
import { Input } from '@/components/Input';
import { useState } from 'react';
import { menuItems, footerItems } from '@/components/menuItems';

export default function DrawerDemo() {
  const [right, setRight] = useState(false);
  const [top, setTop] = useState(false);

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">抽屉示例</div>}
    >
      <div className="relative space-y-6 min-h-[520px]">
        <Card title="触发器">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setRight(true)}>右侧抽屉</Button>
            <Button appearance="ghost" variant="default" onClick={() => setTop(true)}>顶部抽屉</Button>
          </div>
        </Card>

        <Drawer open={right} onClose={() => setRight(false)} title="右侧抽屉" placement="right"
          footer={<div className="flex items-center justify-end gap-2"><Button variant="default" onClick={() => setRight(false)}>关闭</Button></div>}
        >
          <div className="space-y-3">
            <Input.Text label="名称" placeholder="请输入" />
            <Input.DateRange label="时间范围" />
          </div>
        </Drawer>

        <Drawer open={top} onClose={() => setTop(false)} title="顶部抽屉" placement="top"
          footer={<div className="flex items-center justify-end gap-2"><Button variant="default" onClick={() => setTop(false)}>关闭</Button></div>}
        >
          顶部抽屉适合通告类或筛选汇总内容。
        </Drawer>
      </div>
    </Layout>
  );
}
