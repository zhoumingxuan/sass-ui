'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import message from '@/components/message';
import { menuItems, footerItems } from '@/components/menuItems';

export default function MessageDemo() {
  const showLoadingThenSuccess = () => {
    const close = message.loading('加载中...');
    setTimeout(() => {
      close();
      message.success('加载完成');
    }, 1200);
  };

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">Message 浮动提示</div>}
    >
      <Card>
        <div className="flex flex-wrap gap-3">
          <Button variant="info" onClick={() => message.info('信息提示')}>Info</Button>
          <Button variant="success" onClick={() => message.success('操作成功')}>Success</Button>
          <Button variant="warning" onClick={() => message.warning('注意事项')}>Warning</Button>
          <Button variant="error" onClick={() => message.error('操作失败')}>Error</Button>
          <Button onClick={showLoadingThenSuccess}>Loading → Success</Button>
          <Button variant="default" onClick={() => message.destroy()}>清除全部</Button>
        </div>
      </Card>
    </Layout>
  );
}

