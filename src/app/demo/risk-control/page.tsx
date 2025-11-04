'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Switch from '@/components/input/Switch';
import Slider from '@/components/input/Slider';
import { Input } from '@/components/Input';
import { RadioGroup } from '@/components/input/Radio';
import Checkbox from '@/components/input/Checkbox';
import type { Option } from '@/components/input/Select';
import { menuItems, footerItems } from '@/components/menuItems';

const RISK_ITEMS: Option[] = [
  { value: 'reverse', label: '盘中拉抬打压后反向交易' },
  { value: 'accumulate', label: '累计算报金额限制' },
  { value: 'single-order', label: '单笔申报风险' },
];

const MARKET_OPTIONS: Option[] = [
  { value: 'sse', label: '上交所' },
  { value: 'szse', label: '深交所' },
  { value: 'hkex', label: '港交所' },
];

const CONTROL_TYPES: Option[] = [
  { value: 'pre', label: '事前' },
  { value: 'realtime', label: '实时' },
  { value: 'post', label: '事后' },
];

const EXECUTION_WINDOWS: Option[] = [
  { value: 'day', label: '按交易日累计' },
  { value: 'session', label: '按交易时段' },
  { value: 'rolling', label: '按滚动窗口' },
];

const ACCOUNT_SELECT_OPTIONS: Option[] = [
  { value: 'acct-group-a', label: '账户组 A' },
  { value: 'acct-group-b', label: '账户组 B' },
  { value: 'acct-001', label: '账户：00123' },
  { value: 'acct-008', label: '账户：00888' },
];

const SECURITY_OPTIONS: Option[] = [
  { value: '600000', label: '600000 浦发银行' },
  { value: '600519', label: '600519 贵州茅台' },
  { value: '000001', label: '000001 平安银行' },
  { value: '00700', label: '00700 腾讯控股' },
];

const SECURITY_POOL_OPTIONS: Option[] = [
  { value: 'hs300', label: '证券池：沪深300' },
  { value: 'sz50', label: '证券池：上证50' },
  { value: 'growth', label: '主题池：成长风格' },
];

type ThresholdRow = {
  id: string;
  label: string;
  unit: string;
  direction: string;
  value: number;
  ban: number;
  enabled: boolean;
};

const THRESHOLD_TEMPLATE: ThresholdRow[] = [
  { id: 'a', label: '连续竞价价格低在4分钟内', unit: '%', direction: '≥', value: 1, ban: 1, enabled: false },
  { id: 'b', label: '连续竞价价格低在4分钟内，行情跌幅(%)', unit: '%', direction: '≥', value: 2, ban: 2, enabled: true },
  { id: 'c', label: '连续竞价价格低在4分钟内，单向累计成交数量(万股)', unit: '万股', direction: '≥', value: 800, ban: 2, enabled: true },
  { id: 'd', label: '连续竞价价格低在4分钟内，单向累计成交金额(万元)', unit: '万元', direction: '≥', value: 500, ban: 2, enabled: false },
  { id: 'e', label: '连续竞价价格低在4分钟内，单向累计成交量占市场成交量的比例(%)', unit: '%', direction: '≥', value: 1, ban: 1, enabled: true },
  { id: 'f', label: '期间且另30分钟内累计反向成交数量(万股)', unit: '万股', direction: '≥', value: 80, ban: 1, enabled: false },
  { id: 'g', label: '期间且另30分钟内累计反向成交金额(万元)', unit: '万元', direction: '≥', value: 1200, ban: 1, enabled: true },
];

const BAN_EXPRESSION_TEXT = '禁止：a and (c≥2万股 or d≥2万元) and e≥1% and g≥';

function RiskRuleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [riskItem, setRiskItem] = useState<string>(RISK_ITEMS[0]?.value ?? '');
  const [ruleName, setRuleName] = useState<string>('新增风险应用');
  const [enabled, setEnabled] = useState<boolean>(false);
  const [priority, setPriority] = useState<number>(50);
  const [market, setMarket] = useState<string>(MARKET_OPTIONS[0]?.value ?? '');
  const [controlType, setControlType] = useState<string>(CONTROL_TYPES[0]?.value ?? '');
  const [executionWindow, setExecutionWindow] = useState<string>(EXECUTION_WINDOWS[0]?.value ?? '');
  const [accountScope, setAccountScope] = useState<'account' | 'group'>('group');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [instrumentType, setInstrumentType] = useState<'security' | 'pool'>('security');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [remark, setRemark] = useState<string>('');
  const [thresholdRows, setThresholdRows] = useState<ThresholdRow[]>(() =>
    THRESHOLD_TEMPLATE.map((row) => ({ ...row }))
  );

  const handleThresholdUpdate = (id: string, patch: Partial<ThresholdRow>) => {
    setThresholdRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const handleSubmit = () => {
    console.info('保存风险配置', {
      riskItem,
      ruleName,
      enabled,
      priority,
      market,
      controlType,
      executionWindow,
      accountScope,
      selectedAccounts,
      instrumentType,
      selectedInstruments,
      remark,
      thresholds: thresholdRows,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      onOk={handleSubmit}
      okText="保存"
      cancelText="取消"
      title="新增风险应用"
      size="lg"
      width={860}
      maskClosable={false}
    >
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
        <span className="font-medium text-gray-600">风险条目：</span>
        <Input.Select
          size="sm"
          value={riskItem}
          onChange={(value) => {
            if (typeof value === 'string') setRiskItem(value);
          }}
          options={RISK_ITEMS}
          className="w-64"
        />
        <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
          累计风控
        </span>
      </div>

      <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">
        <section className="rounded-md border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">风控规则设置</div>
            <Switch label="启停状态" size="small" value={enabled} onChange={setEnabled} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <Input.Text
                label="风险名称"
                value={ruleName}
                onChange={(event) => setRuleName(event.target.value)}
                maxLength={30}
                helper={`${ruleName.length}/30`}
              />
            </div>
            <div className="md:col-span-4">
              <Input.Text label="风险编号" value="系统生成" disabled />
            </div>
            <div className="md:col-span-4">
              <Slider
                label="风控生效优先级"
                min={0}
                max={100}
                value={priority}
                onChange={(event) => setPriority(Number(event.target.value))}
                helper="优先级越高越先执行"
              />
            </div>
            <div className="md:col-span-4">
              <Input.Select
                label="控制市场"
                value={market}
                onChange={(value) => {
                  if (typeof value === 'string') setMarket(value);
                }}
                options={MARKET_OPTIONS}
              />
            </div>
            <div className="md:col-span-4">
              <Input.Select
                label="控制类型"
                value={controlType}
                onChange={(value) => {
                  if (typeof value === 'string') setControlType(value);
                }}
                options={CONTROL_TYPES}
              />
            </div>
            <div className="md:col-span-4">
              <Input.Select
                label="执行窗口"
                value={executionWindow}
                onChange={(value) => {
                  if (typeof value === 'string') setExecutionWindow(value);
                }}
                options={EXECUTION_WINDOWS}
              />
            </div>
            <div className="md:col-span-12">
              <RadioGroup
                label="控制账户"
                name="account-scope"
                value={accountScope}
                inline
                options={[
                  { value: 'account', label: '账户' },
                  { value: 'group', label: '账户组' },
                ]}
                onChange={(value) => setAccountScope(value as 'account' | 'group')}
              />
              <div className="mt-2 flex items-end gap-2">
                <Input.Select
                  label="纳入对象"
                  multiple
                  value={selectedAccounts}
                  onChange={(value) => {
                    if (Array.isArray(value)) {
                      setSelectedAccounts(
                        value
                          .map((item) => (typeof item === 'string' ? item : item?.value))
                          .filter((item): item is string => Boolean(item))
                      );
                    }
                  }}
                  options={ACCOUNT_SELECT_OPTIONS}
                  placeholder="请选择账户或账户组"
                  className="flex-1"
                />
                <Button type="button" variant="primary">
                  + 添加
                </Button>
              </div>
            </div>
            <div className="md:col-span-12">
              <RadioGroup
                label="控制标的"
                name="instrument-type"
                value={instrumentType}
                inline
                options={[
                  { value: 'security', label: '证券' },
                  { value: 'pool', label: '证券池' },
                ]}
                onChange={(value) => setInstrumentType(value as 'security' | 'pool')}
              />
              <div className="mt-2 flex items-end gap-2">
                <Input.Select
                  label="标的列表"
                  multiple
                  value={selectedInstruments}
                  onChange={(value) => {
                    if (Array.isArray(value)) {
                      setSelectedInstruments(
                        value
                          .map((item) => (typeof item === 'string' ? item : item?.value))
                          .filter((item): item is string => Boolean(item))
                      );
                    }
                  }}
                  options={instrumentType === 'security' ? SECURITY_OPTIONS : SECURITY_POOL_OPTIONS}
                  placeholder="请选择证券或证券池"
                  className="flex-1"
                />
                <Button type="button" variant="primary">
                  + 添加
                </Button>
              </div>
            </div>
            <div className="md:col-span-12">
              <Input.TextArea
                label="备注"
                placeholder="可填写执行说明、审批意见等补充信息"
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                rows={3}
              />
            </div>
          </div>
        </section>

        <section className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {BAN_EXPRESSION_TEXT}
        </section>

        <section className="rounded-md border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">风险阈值设置</div>
          <div className="mt-3 max-h-[260px] overflow-auto rounded-md border border-gray-100">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">风险参数</th>
                  <th className="px-3 py-2 text-left w-24">比较方向</th>
                  <th className="px-3 py-2 text-left w-32">阈值</th>
                  <th className="px-3 py-2 text-left w-28">禁止</th>
                  <th className="px-3 py-2 text-left w-24">启用</th>
                </tr>
              </thead>
              <tbody>
                {thresholdRows.map((row, index) => (
                  <tr key={row.id} className="border-t border-gray-100">
                    <td className="px-3 py-3 align-top">
                      <div className="flex gap-2">
                        <span className="text-xs text-gray-400">{String.fromCharCode(97 + index)}.</span>
                        <span>{row.label}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span className="inline-flex h-8 items-center text-base text-gray-700">{row.direction}</span>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <Input.Number
                        size="sm"
                        value={row.value}
                        onChange={(value) => handleThresholdUpdate(row.id, { value: value ?? 0 })}
                        min={0}
                        precision={row.unit === '%' ? 1 : 0}
                      />
                      <div className="mt-1 text-xs text-gray-400">{row.unit}</div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <Input.Number
                        size="sm"
                        value={row.ban}
                        onChange={(value) => handleThresholdUpdate(row.id, { ban: value ?? 0 })}
                        min={0}
                      />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <Checkbox
                        checked={row.enabled}
                        onChange={(event) =>
                          handleThresholdUpdate(row.id, { enabled: event.target.checked })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Modal>
  );
}

export default function RiskControlDemoPage() {
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">风控配置示例</div>}
    >
      <div className="space-y-6">
        <Card title="仅演示对话框">
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            新增风险应用
          </Button>
        </Card>
      </div>

      <RiskRuleModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Layout>
  );
}
