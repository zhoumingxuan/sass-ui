"use client";

import Layout from "@/components/Layout";
import Card from "@/components/Card";
import Button from "@/components/Button";
import message from "@/components/message";
import { menuItems, footerItems } from "@/components/menuItems";

export default function MessageDemo() {
  const showLoadingThenSuccess = () => {
    const close = message.loading("加载中...", 0);
    setTimeout(() => {
      close();
      message.success("加载完成", 1500);
    }, 1200);
  };

  const setPlacement = (p: "top-center" | "top-right" | "top-left") => {
    message.config({ placement: p });
    message.info(`已切换位置：${p}`, 1200);
  };

  const setDefaultDuration = (ms: number) => {
    message.config({ duration: ms });
    message.info(`默认时长：${ms}ms`, 1200);
  };

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">Message 浮动提示</div>}
    >
      <Card title="基础">
        <div className="flex flex-wrap gap-3">
          <Button variant="info" onClick={() => message.info("信息提示")}>Info</Button>
          <Button variant="success" onClick={() => message.success("操作成功")}>Success</Button>
          <Button variant="warning" onClick={() => message.warning("注意事项")}>Warning</Button>
          <Button variant="error" onClick={() => message.error("操作失败")}>Error</Button>
          <Button onClick={showLoadingThenSuccess}>Loading → Success</Button>
          <Button variant="default" onClick={() => message.destroy()}>清除全部</Button>
        </div>
      </Card>

      <Card title="位置与时长">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-500">位置:</span>
          <Button variant="default" onClick={() => setPlacement("top-left")}>Top-Left</Button>
          <Button variant="default" onClick={() => setPlacement("top-center")}>Top-Center</Button>
          <Button variant="default" onClick={() => setPlacement("top-right")}>Top-Right</Button>
          <span className="mx-3 h-6 w-px bg-gray-200" />
          <span className="text-sm text-gray-500">默认时长:</span>
          <Button variant="default" onClick={() => setDefaultDuration(1000)}>1s</Button>
          <Button variant="default" onClick={() => setDefaultDuration(3000)}>3s</Button>
          <Button variant="default" onClick={() => setDefaultDuration(5000)}>5s</Button>
        </div>
      </Card>

      <Card title="文本与关闭按钮">
        <div className="flex flex-wrap gap-3">
          <Button variant="info" onClick={() => message.info("短文本提示")}>短文本</Button>
          <Button
            variant="info"
            onClick={() =>
              message.info(
                "这是一段较长的消息内容，用于测试换行与自适应宽度。为了保证可读性，文本将按单词/汉字边界在合适处换行，不会撑满屏幕。",
                5000
              )
            }
          >
            长文本
          </Button>
          <Button
            variant="info"
            onClick={() =>
              message.info(
                "支持\n手动换行并保留段落。\n第二段：展示 whitespace-pre-line 的效果。",
                5000
              )
            }
          >
            多行文本
          </Button>
          <Button variant="default" onClick={() => message.success("默认不带关闭按钮")}>默认不带关闭</Button>
          <Button
            variant="default"
            onClick={() => message.success("显示关闭按钮（长文本也不遮挡）这是一段非常非常非常长的文本，用于测试在开启关闭按钮时，文本如何自适应换行并保证最佳可读性。", { showClose: true, duration: 4000 })}
          >
            显示关闭按钮
          </Button>
        </div>
      </Card>
    </Layout>
  );
}
