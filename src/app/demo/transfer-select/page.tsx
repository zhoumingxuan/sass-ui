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

export default function TransferSelectDemo() {
  const [teamMembers, setTeamMembers] = useState<string[]>(["pm", "fe", "qa"]);
  const [skillMatrix, setSkillMatrix] = useState<Option[]>([skillOptions[0], skillOptions[3], skillOptions[4]]);

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
      </div>
    </Layout>
  );
}

