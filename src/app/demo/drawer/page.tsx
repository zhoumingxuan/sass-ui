'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Drawer from '@/components/Drawer';
import { Input } from '@/components/Input';
import { useState } from 'react';
import { menuItems, footerItems } from '@/components/menuItems';

export default function DrawerDemo() {
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">抽屉示例</div>}
    >
      <div className="relative space-y-6 min-h-[520px]">
        <Card title="常用操作">
          <div className="flex flex-wrap gap-3">
            <Button appearance="ghost" variant="default" onClick={() => setShowFilter(true)}>高级筛选（顶部）</Button>
            <Button onClick={() => setShowOrderDetail(true)}>订单详情（右侧）</Button>
            <Button variant="primary" onClick={() => setShowNewCustomer(true)}>新建客户（右侧表单）</Button>
            <Button variant="warning" onClick={() => setShowAssign(true)}>分配销售（右侧）</Button>
          </div>
        </Card>

        <Drawer open={showOrderDetail} onClose={() => setShowOrderDetail(false)} title="订单详情" placement="right"
          footer={<div className="flex items-center justify-end gap-2"><Button variant="default" onClick={() => setShowOrderDetail(false)}>关闭</Button></div>}
        >
          <div className="space-y-3">
            <Input.Text label="订单号" placeholder="#2025-000138" />
            <Input.Select label="订单状态" options={[{ value: 'pending', label: '待支付' }, { value: 'paid', label: '已支付' }, { value: 'shipped', label: '已发货' }]} />
            <Input.Date label="下单日期" />
            <Input.TextArea label="备注" placeholder="补充说明..." />
          </div>
        </Drawer>

        <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="高级筛选" placement="top"
          footer={<div className="flex items-center justify-end gap-2"><Button variant="default" onClick={() => setShowFilter(false)}>收起</Button><Button>应用筛选</Button></div>}
        >
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            <div className="col-span-12 md:col-span-3"><Input.Text label="客户名" placeholder="如：张三" /></div>
            <div className="col-span-12 md:col-span-3"><Input.Select label="客户等级" options={[{ value: 'A', label: 'A级' }, { value: 'B', label: 'B级' }, { value: 'C', label: 'C级' }]} /></div>
            <div className="col-span-12 md:col-span-3"><Input.Select label="订单状态" options={[{ value: 'pending', label: '待支付' }, { value: 'paid', label: '已支付' }, { value: 'refund', label: '退款中' }]} /></div>
            <div className="col-span-12 md:col-span-3"><Input.DateRange label="下单时间" /></div>
          </div>
        </Drawer>

        <Drawer open={showNewCustomer} onClose={() => setShowNewCustomer(false)} title="新建客户" placement="right"
          footer={<div className="flex items-center justify-end gap-2"><Button variant="default" onClick={() => setShowNewCustomer(false)}>取消</Button><Button>保存</Button></div>}
        >
          <div className="space-y-3">
            <Input.Text label="客户名称" placeholder="请输入" />
            <Input.Number label="信用额度" placeholder="请输入" />
            <Input.Date label="合作开始" />
            <Input.Select label="客户类型" options={[{ value: 'A', label: '直客' }, { value: 'B', label: '代理' }]} />
            <Input.TextArea label="备注" placeholder="请输入" />
          </div>
        </Drawer>

        <Drawer open={showAssign} onClose={() => setShowAssign(false)} title="分配销售" placement="right" 
          maskClosable={false}
          footer={<div className="flex items-center justify-end gap-2"><Button variant="default" onClick={() => setShowAssign(false)}>取消</Button><Button variant="warning">分配</Button></div>}
        >
          <div className="space-y-2">
            <Input.Select label="选择销售" options={[{ value: 'u1', label: '王丽（华东）' }, { value: 'u2', label: '李强（华南）' }]} />
            <Input.TextArea label="备注" placeholder="补充说明..." />
          </div>
        </Drawer>
      </div>
    </Layout>
  );
}
