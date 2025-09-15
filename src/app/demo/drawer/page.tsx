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
  const [left, setLeft] = useState(false);
  const [top, setTop] = useState(false);
  const [bottom, setBottom] = useState(false);

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">抽屉示例</div>}
    >
      <div className="space-y-6">
        <Card title="触发器">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setRight(true)}>右侧抽屉</Button>
            <Button appearance="ghost" variant="default" onClick={() => setLeft(true)}>左侧抽屉</Button>
            <Button appearance="ghost" variant="default" onClick={() => setTop(true)}>顶部抽屉</Button>
            <Button appearance="ghost" variant="default" onClick={() => setBottom(true)}>底部抽屉</Button>
          </div>
        </Card>

        <Drawer open={right} onClose={() => setRight(false)} title="右侧抽屉" placement="right" width={420}
          footer={<div className="flex items-center justify-end gap-2"><Button variant="default" onClick={() => setRight(false)}>关闭</Button></div>}
        >
          <div className="space-y-3">
            <Input.Text label="名称" placeholder="请输入" />
            <Input.DateRange label="时间范围" />
          </div>
        </Drawer>

        <Drawer open={left} onClose={() => setLeft(false)} title="左侧抽屉" placement="left" width={360}
          footer={<div className="flex items-center justify-end gap-2"><Button variant="default" onClick={() => setLeft(false)}>关闭</Button></div>}
        >
          <div className="space-y-3">
            <Input.Select label="分类" options={[{ value: 'all', label: '全部' }, { value: '1', label: '类型一' }]} />
          </div>
        </Drawer>

        <Drawer open={top} onClose={() => setTop(false)} title="顶部抽屉" placement="top" width={360}
          footer={<div className="flex items-center justify-end gap-2"><Button variant="default" onClick={() => setTop(false)}>关闭</Button></div>}
        >
          顶部抽屉适合通告类或筛选汇总内容。
        </Drawer>

        <Drawer open={bottom} onClose={() => setBottom(false)} title="底部抽屉" placement="bottom" width={360}
          footer={<div className="flex items-center justify-end gap-2"><Button variant="default" onClick={() => setBottom(false)}>关闭</Button></div>}
        >
          底部抽屉适合移动端或需要就近操作的场景。
        </Drawer>
      </div>
    </Layout>
  );
}

