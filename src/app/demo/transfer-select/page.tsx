"use client";

import { useState } from "react";
import type { Option } from "@/components/input/Select";
import { Input } from "@/components/Input";
import Layout from "@/components/Layout";
import Card from "@/components/Card";
import { menuItems, footerItems } from "@/components/menuItems";

const memberOptions: Option[] = [
  { value: "pm", label: "产品经理", title: "产品经理" },
  { value: "pd", label: "产品设计", title: "产品设计" },
  { value: "fe", label: "前端开发", title: "前端开发（Frontend）" },
  { value: "be", label: "后端开发", title: "后端开发（Backend）" },
  { value: "qa", label: "测试工程师", title: "测试工程师" },
  { value: "ops", label: "运维工程师", title: "运维工程师" },
  { value: "data", label: "数据分析师", title: "数据分析师" },
  { value: "mkt", label: "市场营销", title: "市场营销" },
  { value: "sale", label: "销售代表", title: "销售代表" },
  { value: "cs", label: "客户成功", title: "客户成功" },
  { value: "legal", label: "法务顾问", title: "法务顾问", disabled: true },
  { value: "finance", label: "财务管理", title: "财务管理" },
];

const skillOptions: Option[] = [
  { value: "react", label: "React", title: "React 生态开发" },
  { value: "vue", label: "Vue", title: "Vue 生态开发" },
  { value: "node", label: "Node.js", title: "Node.js 服务端" },
  { value: "python", label: "Python", title: "Python 数据与服务" },
  { value: "go", label: "Go", title: "Go 服务端" },
  { value: "rust", label: "Rust", title: "Rust 系统编程" },
  { value: "design", label: "UI 设计", title: "UI/UX 设计" },
  { value: "pm", label: "项目管理", title: "项目管理" },
  { value: "qa", label: "质量保障", title: "质量保障" },
];

const stockOptions: Option[] = [
  { value: "600519", label: "贵州茅台（600519）", title: "贵州茅台" },
  { value: "000858", label: "五粮液（000858）", title: "五粮液" },
  { value: "601318", label: "中国平安（601318）", title: "中国平安" },
  { value: "000333", label: "美的集团（000333）", title: "美的集团" },
  { value: "000651", label: "格力电器（000651）", title: "格力电器" },
  { value: "600036", label: "招商银行（600036）", title: "招商银行" },
  { value: "600276", label: "恒瑞医药（600276）", title: "恒瑞医药" },
  { value: "002415", label: "海康威视（002415）", title: "海康威视" },
  { value: "000725", label: "京东方A（000725）", title: "京东方A" },
  { value: "600030", label: "中信证券（600030）", title: "中信证券" },
  { value: "601166", label: "兴业银行（601166）", title: "兴业银行" },
  { value: "600104", label: "上汽集团（600104）", title: "上汽集团" },
  { value: "002594", label: "比亚迪（002594）", title: "比亚迪" },
  { value: "600585", label: "海螺水泥（600585）", title: "海螺水泥" },
  { value: "300760", label: "迈瑞医疗（300760）", title: "迈瑞医疗" },
  { value: "600887", label: "伊利股份（600887）", title: "伊利股份" },
  { value: "600660", label: "福耀玻璃（600660）", title: "福耀玻璃" },
  { value: "601888", label: "中国中免（601888）", title: "中国中免" },
  { value: "000538", label: "云南白药（000538）", title: "云南白药" },
  { value: "688981", label: "中芯国际（688981）", title: "中芯国际" },
  { value: "600048", label: "保利发展（600048）", title: "保利发展" },
  { value: "601012", label: "隆基绿能（601012）", title: "隆基绿能" },
  { value: "601628", label: "中国人寿（601628）", title: "中国人寿" },
  { value: "aapl", label: "Apple（纳斯达克）", title: "Apple" },
  { value: "msft", label: "Microsoft（纳斯达克）", title: "Microsoft" },
  { value: "tsla", label: "Tesla（纳斯达克）", title: "Tesla" },
  { value: "nvda", label: "NVIDIA（纳斯达克）", title: "NVIDIA" },
];

export default function TransferSelectDemo() {
  const [teamMembers, setTeamMembers] = useState<string[]>(["pm", "fe", "qa"]);
  const [skillMatrix, setSkillMatrix] = useState<Option[]>([skillOptions[0], skillOptions[3], skillOptions[4]]);
  const [watchList, setWatchList] = useState<string[]>(["600519", "600036", "aapl", "nvda"]);

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">穿梭选择 TransferSelect</div>}
    >
      <div className="space-y-6">
        <Card title="基础用法（穿梭面板 + 自适应展示）">
          <div className="space-y-4">
            <Input.TransferSelect
              options={memberOptions}
              value={teamMembers}
              onChange={(value) => {
                if (Array.isArray(value)) {
                  const next = value.filter((item): item is string => typeof item === "string");
                  setTeamMembers(next);
                }
              }}
              placeholder="请选择成员"
              clearable
              panelMinHeight={280}
              panelMaxHeight={520}
              helper="双击可快速在两个列表之间移动，禁用项无法选中。"
            />
            <div className="text-sm text-gray-600">
              当前选中：
              <span className="ml-2 font-medium text-gray-800">{teamMembers.length} 人</span>
            </div>
          </div>
        </Card>

        <Card title="labelAndValue 模式 + 搜索自定义文案">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Input.TransferSelect
                options={skillOptions}
                value={skillMatrix}
                onChange={(value) => {
                  if (Array.isArray(value)) {
                    const objects = value.filter((item): item is Option => typeof item === "object" && item !== null);
                    setSkillMatrix(objects);
                  }
                }}
                labelAndValue
                placeholder="请选择能力标签"
                sourceTitle="技能池"
                targetTitle="我的技能"
                searchPlaceholder={{ source: "过滤技能池", target: "过滤已选技能" }}
                emptyText={{ source: "暂无匹配的技能", target: "尚未选择技能" }}
                helper="开启 labelAndValue 后，onChange 会返回 Option 对象数组。"
              />
              <div className="text-xs text-gray-500">
                当前值：
                <code className="ml-1 block rounded bg-gray-100 px-2 py-1 whitespace-pre-wrap break-all">
                  {skillMatrix.length
                    ? JSON.stringify(skillMatrix, ["value", "title", "label"], 2)
                    : "[]"}
                </code>
              </div>
            </div>
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              <ul className="list-disc space-y-2 pl-5">
                <li>穿梭面板沿用了 Select 的多选展示逻辑，标签会根据容器宽度自动折行并显示 +N。</li>
                <li>默认带搜索输入，可通过 showSearch 关闭或自定义 placeholder 文案。</li>
                <li>移动按钮以及双击操作都可将选项快速在左右列表间切换。</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card title="批量股票选择（大量选项场景）">
          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <div className="space-y-2">
              <Input.TransferSelect
                options={stockOptions}
                value={watchList}
                onChange={(value) => {
                  if (Array.isArray(value)) {
                    const next = value.filter((item): item is string => typeof item === "string");
                    setWatchList(next);
                  }
                }}
                placeholder="请选择要关注的股票"
                searchPlaceholder={{ source: "按代码 / 名称检索", target: "过滤已选自选股" }}
                emptyText={{ target: "尚未加入任何自选股" }}
                panelMinHeight={280}
                panelMaxHeight={520}
              />
            </div>
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              <div className="mb-2 font-medium text-gray-700">当前自选股</div>
              <ul className="list-disc space-y-1 pl-5">
                {watchList.length ? (
                  watchList.map((item) => {
                    const option = stockOptions.find(stock => stock.value === item);
                    return (
                      <li key={item} className="truncate">
                        {option?.label ?? item}
                      </li>
                    );
                  })
                ) : (
                  <li className="text-gray-400">尚未选择</li>
                )}
              </ul>
              <div className="mt-3 text-xs text-gray-500">
                列表超过视口时自动限制高度并出现滚动条，保持输入区域与下拉面板无缝衔接。
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

