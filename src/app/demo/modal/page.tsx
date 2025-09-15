'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { useMemo, useState } from 'react';
import { menuItems, footerItems } from '@/components/menuItems';

export default function ModalDemo() {
  // basic scenarios
  const [basicOpen, setBasicOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [largeOpen, setLargeOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [topOpen, setTopOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);

  // simple validation state
  const [vName, setVName] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vAgree, setVAgree] = useState(false);
  const vErr = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!vName.trim()) errs.name = '请输入名称';
    if (!vEmail.trim()) errs.email = '请输入邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vEmail)) errs.email = '邮箱格式不正确';
    if (!vAgree) errs.agree = '请勾选协议';
    return errs;
  }, [vName, vEmail, vAgree]);

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">模态框示例</div>}
    >
      <div className="space-y-6">
        <Card title="触发器">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setBasicOpen(true)}>基础模态框</Button>
            <Button appearance="ghost" variant="info" onClick={() => setInfoOpen(true)}>信息提示</Button>
            <Button variant="warning" onClick={() => setConfirmOpen(true)}>二次确认</Button>
            <Button variant="default" onClick={() => setLargeOpen(true)}>较大内容</Button>
            <Button variant="error" onClick={() => setDangerOpen(true)}>危险操作</Button>
            <Button appearance="ghost" variant="default" onClick={() => setTopOpen(true)}>顶部对齐（720）</Button>
            <Button variant="primary" onClick={() => setValidateOpen(true)}>表单校验</Button>
          </div>
        </Card>

        {/* 基础模态：不带默认底部 */}
        <Modal open={basicOpen} title="基本对话框" onClose={() => setBasicOpen(false)}>
          这是一个简洁的模态对话框，用于承载中等长度的内容。专注于当前操作，支持 Esc 关闭。
        </Modal>

        {/* 信息提示：自定义底部，仅一个确认 */}
        <Modal
          open={infoOpen}
          title="温馨提示"
          variant="info"
          onClose={() => setInfoOpen(false)}
          footer={<div className="flex items-center justify-end gap-2"><Button variant="default" onClick={() => setInfoOpen(false)}>知道了</Button></div>}
        >
          信息类对话框使用柔和强调，不喧宾夺主。
        </Modal>

        {/* 二次确认：默认底部，异步确认 */}
        <Modal
          open={confirmOpen}
          title="确认提交本次变更？"
          variant="confirm"
          maskClosable={false}
          onClose={() => setConfirmOpen(false)}
          onOk={async () => {
            setConfirmBusy(true);
            await new Promise(r => setTimeout(r, 1200));
            setConfirmBusy(false);
          }}
          confirmLoading={confirmBusy}
          okText="提交"
          cancelText="取消"
        >
          提交后将触发后端任务执行（可撤回时间较短）。请确认内容无误。
        </Modal>

        {/* 较大内容：size=lg，内含表单元素 */}
        <Modal open={largeOpen} title="较大内容容器" size="lg" onClose={() => setLargeOpen(false)}>
          <div className="space-y-3">
            <p>适用于较多说明或表单，边距与行高保证可读性。</p>
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12 md:col-span-6"><Input.Text label="名称" placeholder="请输入" /></div>
              <div className="col-span-12 md:col-span-6"><Input.Number label="数量" placeholder="请输入" /></div>
              <div className="col-span-12 md:col-span-6"><Input.Date label="日期" /></div>
              <div className="col-span-12 md:col-span-6"><Input.Select label="类型" options={[{ value: '1', label: 'A' }, { value: '2', label: 'B' }]} /></div>
            </div>
          </div>
        </Modal>

        {/* 危险操作：强调但不过分吸睛 */}
        <Modal
          open={dangerOpen}
          title="删除后将无法恢复，是否继续？"
          variant="danger"
          onClose={() => setDangerOpen(false)}
          onOk={async () => { await new Promise(r => setTimeout(r, 500)); }}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ variant: 'error' }}
        >
          请再次确认，危险操作采用醒目但不过分的色彩提示，避免误触。
        </Modal>

        {/* 顶部对齐 + 定宽（适配 1440 布局） */}
        <Modal open={topOpen} title="顶部对齐 + 自定义宽度" centered={false} width={720} onClose={() => setTopOpen(false)} footer={null}>
          顶部对齐更利于长内容阅读；示例自定义宽度 720px，保持设计基准。
        </Modal>

        {/* 抽屉示例已迁移到 /demo/drawer 页面，避免与模态混用 */}

        {/* 表单校验：本地校验示例 */}
        <Modal
          open={validateOpen}
          onClose={() => setValidateOpen(false)}
          title="表单校验"
          onOk={async () => {
            if (Object.keys(vErr).length > 0) throw new Error('invalid');
          }}
          okText="保存"
          cancelText="取消"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">名称</label>
              <input value={vName} onChange={(e) => setVName(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="请输入" />
              {vErr.name && <div className="mt-1 text-xs text-error">{vErr.name}</div>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">邮箱</label>
              <input value={vEmail} onChange={(e) => setVEmail(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="name@example.com" />
              {vErr.email && <div className="mt-1 text-xs text-error">{vErr.email}</div>}
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={vAgree} onChange={(e) => setVAgree(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              我已阅读并同意协议
            </label>
            {vErr.agree && <div className="-mt-1 text-xs text-error">{vErr.agree}</div>}
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
