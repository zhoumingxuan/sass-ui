'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { useState } from 'react';
import { menuItems, footerItems } from '@/components/menuItems';

export default function ModalDemo() {
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">模态框示例</div>}
    >
      <div className="space-y-6">
        <Card title="常用操作">
          <div className="flex flex-wrap gap-3">
            <Button variant="error" onClick={() => setDeleteUserOpen(true)}>删除客户</Button>
            <Button variant="primary" onClick={() => setPublishOpen(true)}>发布商品</Button>
            <Button variant="default" onClick={() => setExportOpen(true)}>导出报表</Button>
            <Button variant="warning" onClick={() => setApproveOpen(true)}>审批请假</Button>
          </div>
        </Card>

        <Modal
          open={deleteUserOpen}
          variant="danger"
          title="确认删除客户？"
          onClose={() => setDeleteUserOpen(false)}
          onOk={async () => { setBusy(true); await new Promise(r => setTimeout(r, 900)); setBusy(false); }}
          confirmLoading={busy}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ variant: 'error' }}
        >
          删除后将无法恢复，相关订单与联系人将解除关联，请谨慎操作。
        </Modal>

        <Modal
          open={publishOpen}
          title="发布商品"
          onClose={() => setPublishOpen(false)}
          onOk={async () => { setBusy(true); await new Promise(r => setTimeout(r, 1000)); setBusy(false); }}
          confirmLoading={busy}
          okText="发布"
          cancelText="取消"
        >
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            <div className="col-span-12 md:col-span-6"><Input.Text label="商品名称" placeholder="请输入" /></div>
            <div className="col-span-12 md:col-span-6"><Input.Number label="库存" placeholder="请输入" /></div>
            <div className="col-span-12 md:col-span-6"><Input.Date label="上架时间" /></div>
            <div className="col-span-12 md:col-span-6"><Input.Select label="类目" options={[{ value: '1', label: '服饰' }, { value: '2', label: '数码' }]} /></div>
          </div>
        </Modal>

        <Modal
          open={exportOpen}
          title="导出报表"
          onClose={() => setExportOpen(false)}
          onOk={async () => { setBusy(true); await new Promise(r => setTimeout(r, 800)); setBusy(false); }}
          confirmLoading={busy}
          okText="开始导出"
          cancelText="取消"
        >
          将根据当前筛选条件导出订单报表（CSV），导出期间可继续浏览。
        </Modal>

        <Modal
          open={approveOpen}
          title="审批请假申请"
          onClose={() => setApproveOpen(false)}
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="default" onClick={() => setApproveOpen(false)}>关闭</Button>
              <Button variant="error" onClick={() => setApproveOpen(false)}>驳回</Button>
              <Button onClick={() => setApproveOpen(false)}>通过</Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12 md:col-span-6"><Input.Text label="申请人" placeholder="张三" /></div>
              <div className="col-span-12 md:col-span-6"><Input.DateRange label="请假时间" /></div>
            </div>
            <div>
              <Input.TextArea label="审批意见" placeholder="请输入" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}

