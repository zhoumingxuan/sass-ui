"use client";

import { useState } from "react";
import type { Option } from "@/components/input/Select";
import Layout from "@/components/Layout";
import Card from "@/components/Card";
import { Input } from "@/components/Input";
import { menuItems, footerItems } from "@/components/menuItems";

const cityOptions: Option[] = [
  { value: "sh", title: "上海", label: "上海（Shanghai）" },
  { value: "bj", title: "北京", label: "北京（Beijing）" },
  { value: "gz", title: "广州", label: "广州（Guangzhou）" },
  { value: "sz", title: "深圳", label: "深圳（Shenzhen）" },
  { value: "hz", title: "杭州", label: "杭州（Hangzhou）" },
  { value: "cd", title: "成都", label: "成都（Chengdu）" },
];

const tagOptions: Option[] = [
  { value: "t1", title: "研发", label: "研发（Product Dev）" },
  { value: "t2", title: "设计", label: "设计（Design）" },
  { value: "t3", title: "产品", label: "产品（Product）" },
  { value: "t4", title: "测试", label: "测试（QA）" },
  { value: "t5", title: "运营", label: "运营（Ops）" },
  { value: "t6", title: "市场", label: "市场（Marketing）" },
  { value: "t7", title: "销售", label: "销售（Sales）" },
  { value: "t8", title: "客服", label: "客服（Support）" },
  { value: "t9", title: "财务", label: "财务（Finance）" },
  { value: "t10", title: "行政", label: "行政（Admin）" },
  { value: "t11", title: "人事", label: "人事（HR）" },
  { value: "t12", title: "法务", label: "法务（Legal）" },
];


// 列表风格示例数据（含副标题与说明）
const projectOptions: Option[] = [
  {
    value: "p1",
    title: "交易风控平台",
    label: "交易风控平台",
    subtitle: "负责人：王小明 · 风控一组",
  },
  {
    value: "p2",
    title: "指标看板（Next 版）",
    label: "指标看板（Next 版）",
    subtitle: "负责人：赵丽 · 数据平台组",
    trailing: "项目A",
  },
  {
    value: "p3",
    title: "多智能体研究（PolyMind）",
    label: "多智能体研究（PolyMind）",
    subtitle: "负责人：周明轩 · 研究院",
  },
];

export default function SelectDemo() {
  const [multiAuto, setMultiAuto] = useState<string[]>(["t1", "t2", "t3", "t4", "t5", "t6"]);
  const [multiFixed, setMultiFixed] = useState<string[]>(["t1", "t2", "t3", "t4", "t5"]);
  const [multiSummary, setMultiSummary] = useState<string[]>(["t2", "t5"]);
  const [singleObjectValue, setSingleObjectValue] = useState<Option | undefined>();
  const [multiObjectValue, setMultiObjectValue] = useState<Option[]>([]);

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">选择器 Select</div>}
    >
      <div className="space-y-6">
        <Card title="单选">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Input.Select placeholder="请选择城市" options={cityOptions} size="sm" clearable />
            </div>
            <div>
              <Input.Select placeholder="请选择城市" clearable options={cityOptions} size="md" />
            </div>
            <div>
              <Input.Select placeholder="请选择城市" options={cityOptions} size="lg" required />
            </div>
          </div>
        </Card>

        <Card title="单选 · 预览卡片（悬停选项显示）">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Input.Select
                placeholder="请选择城市"
                options={cityOptions}
                size="md"
                clearable
                renderPreview={(opt) => (
                  <div>
                    <div className="font-medium">{opt.title ?? opt.label}</div>
                    <div className="mt-1 text-gray-500">下拉显示：{opt.label}</div>
                    <div className="mt-1 text-gray-500">值：{opt.value}</div>
                  </div>
                )}
              />
            </div>
          </div>
        </Card>

        <Card title="多选 · 自适应（按容器宽度自动）">
          <div className="space-y-2">
            <Input.Select
              multiple
              placeholder="请选择标签"
              options={tagOptions}
              value={multiAuto}
              onChange={value => {
                if (Array.isArray(value) && value.every(item => typeof item === "string")) {
                  setMultiAuto(value);
                }
              }}
              clearable
              // 自适应：不传 maxTagCount，按容器宽度自动计算
            />
            <div className="text-sm text-gray-600">当前选择：{multiAuto.length} 项（你可以缩放窗口或改变容器宽度观察 +N 的变化）</div>
          </div>
        </Card>

        <Card title="多选 · 自适应（不同容器宽度示例）">
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-sm text-gray-600">w-80 宽度</div>
              <div className="w-80">
                <Input.Select
                  multiple
                  placeholder="请选择标签"
                  options={tagOptions}
                  value={multiFixed}
                  onChange={value => {
                    if (Array.isArray(value) && value.every(item => typeof item === "string")) {
                      setMultiFixed(value);
                    }
                  }}
                  clearable
                />
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm text-gray-600">w-full 宽度</div>
              <div className="w-full">
                <Input.Select
                  multiple
                  placeholder="请选择标签"
                  options={tagOptions}
                  value={multiSummary}
                  onChange={value => {
                    if (Array.isArray(value) && value.every(item => typeof item === "string")) {
                      setMultiSummary(value);
                    }
                  }}
                  clearable
                />
              </div>
            </div>
          </div>
        </Card>

        <Card title="多选 · 列表风格（标题/副标题/说明）">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Input.Select
                placeholder="请选择项目"
                options={projectOptions}
                size="md"
                multiple
                clearable
                // 开启列表风格
                itemVariant="list"
              />
            </div>
          </div>
        </Card>

        <Card title="labelAndValue：返回选项对象" className="h-[400px] mb-10">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-sm text-gray-600">单选示例（返回 Option 对象）</div>
              <Input.Select
                placeholder="请选择城市"
                options={cityOptions}
                value={singleObjectValue}
                onChange={(v) => {
                  if (!Array.isArray(v)) {
                    setSingleObjectValue(typeof v === "object" ? (v as Option | undefined) : undefined);
                  }
                }}
                clearable
                labelAndValue
              />
              <div className="mt-2 text-xs text-gray-500">
                当前值：
                <code className="ml-1 rounded bg-gray-100 px-2 py-1 whitespace-pre-wrap break-all">
                  {singleObjectValue ? JSON.stringify(singleObjectValue, ["value", "title", "label"]) : "无"}
                </code>
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm text-gray-600">多选示例（返回 Option[]）</div>
              <Input.Select
                multiple
                placeholder="请选择标签"
                options={tagOptions}
                value={multiObjectValue}
                onChange={(v) => {
                  if (Array.isArray(v)) {
                    const objectValues = v.filter((item): item is Option => typeof item === "object" && item !== null);
                    setMultiObjectValue(objectValues);
                  }
                }}
                clearable
                labelAndValue
              />
              <div className="mt-2 text-xs text-gray-500">
                当前值：
                <code className="ml-1 block rounded bg-gray-100 px-2 py-1 whitespace-pre-wrap break-all">
                  {multiObjectValue.length ? JSON.stringify(multiObjectValue, ["value", "title", "label"]) : "[]"}
                </code>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </Layout>
  );
}
