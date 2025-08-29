'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { useState } from 'react';
import { menuItems, footerItems } from '@/components/menuItems';

export default function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">模态框示例</div>}
    >
      <Card>
        <Button onClick={() => setOpen(true)}>打开模态框</Button>
      </Card>
      <Modal show={open} title="标题" onClose={() => setOpen(false)}>
        <p>这是模态框内容。</p>
        <div className="mt-4 flex justify-end gap-3">
          <Button appearance="outline" variant="default" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={() => setOpen(false)}>确定</Button>
        </div>
      </Modal>
    </Layout>
  );
}
