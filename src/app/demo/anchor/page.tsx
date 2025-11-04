'use client';

import type { ReactNode } from 'react';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Anchor from '@/components/Anchor';
import Button from '@/components/Button';
import Form from '@/components/Form';
import { Input } from '@/components/Input';
import Switch from '@/components/Switch';
import { RadioGroup } from '@/components/Radio';
import { CheckboxGroup } from '@/components/Checkbox';
import { menuItems, footerItems } from '@/components/menuItems';

type BlockProps = {
  title: string;
  minH: number;
  bg: string;
  text?: string;
};

function Block({ title, minH, bg, text = '' }: BlockProps) {
  return (
    <div className={`${bg} p-4`} style={{ minHeight: minH }}>
      <div className="text-lg font-medium mb-2">{title}</div>
      <p className="text-gray-700">
        {text ||
          '用于测试锚点在不同高度内容块下的中点判定表现。上下滚动观察左侧高亮与滚动位置的联动是否稳定、无抖动？'}
      </p>
    </div>
  );
}

type FormSectionProps = {
  title: string;
  description: string;
  accentClass: string;
  children: ReactNode;
};

function FormSection({ title, description, accentClass, children }: FormSectionProps) {
  return (
    <section className="rounded-md bg-white p-6 shadow-sm">
      <header className="mb-6 space-y-3">
        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold ${accentClass}`}
        >
          <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
          {title}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </header>
      {children}
    </section>
  );
}

type FormSectionConfig = {
  key: string;
  label: string;
  accent: string;
  description: string;
  content: ReactNode;
};

export default function AnchorDemo() {
  const formRef = Form.useForm();

  const itemsBasic = [
    { key: 'a', label: '概览', content: <Block title="概览" minH={320} bg="bg-blue-200" /> },
    { key: 'b', label: '明细', content: <Block title="明细" minH={720} bg="bg-green-200" /> },
    { key: 'c', label: '结论', content: <Block title="结论" minH={420} bg="bg-red-200" /> },
  ];

  const itemsMany = Array.from({ length: 10 }, (_, i) => {
    const palette = [
      'bg-indigo-200',
      'bg-emerald-200',
      'bg-amber-200',
      'bg-sky-200',
      'bg-rose-200',
      'bg-lime-200',
    ];
    const heights = [360, 520, 300, 640, 100, 360, 280, 600, 340, 480];
    return {
      key: `m-${i + 1}`,
      label: `章节${i + 1}`,
      content: (
        <Block
          title={`章节 ${i + 1}`}
          minH={heights[i]}
          bg={palette[i % palette.length]}
        />
      ),
    };
  });

  const itemsExtreme = [
    { key: 'x-1', label: '短块', content: <Block title="短块" minH={220} bg="bg-amber-200" /> },
    { key: 'x-2', label: '超长块', content: <Block title="超长块" minH={1200} bg="bg-sky-200" /> },
    { key: 'x-3', label: '短块', content: <Block title="短块" minH={240} bg="bg-emerald-200" /> },
    { key: 'x-4', label: '较长块', content: <Block title="较长块" minH={800} bg="bg-rose-200" /> },
  ];

  const provinceOptions = [
    { value: 'sh', label: '上海' },
    { value: 'bj', label: '北京' },
    { value: 'gd', label: '广东' },
    { value: 'zj', label: '浙江' },
  ];

  const industryOptions = [
    { value: 'it', label: '软件与信息服务' },
    { value: 'manufacture', label: '先进制造' },
    { value: 'finance', label: '金融服务' },
    { value: 'commerce', label: '商业贸易' },
  ];

  const overdueOptions = [
    { value: 'none', label: '无逾期' },
    { value: 'minor', label: '个别款项逾期' },
    { value: 'major', label: '多笔逾期' },
  ];

  const riskTagOptions = [
    { value: 'finance', label: '融资依赖高' },
    { value: 'supplier', label: '供应链集中' },
    { value: 'governance', label: '治理结构待完善' },
    { value: 'compliance', label: '合规资料需补充' },
  ];

  const alarmChannelOptions = [
    { value: 'email', label: '邮件通知' },
    { value: 'sms', label: '短信通知' },
    { value: 'wechat', label: '企业微信' },
  ];

  const longFormInitialValues = {
    companyName: '',
    creditCode: '',
    province: undefined,
    foundedAt: undefined,
    industry: undefined,
    contactName: '',
    contactPhone: '',
    address: '',
    lastYearRevenue: undefined,
    staffSize: undefined,
    businessHighlights: '',
    coreProducts: '',
    futurePlan: '',
    hasLawsuit: 'no',
    overdueStatus: 'none',
    riskTags: [],
    riskNotes: '',
    confirmOwner: false,
    warningContact: '',
    contactEmail: '',
    alarmChannels: ['email'],
    otherChannels: '',
    agreeTerms: false,
  } as const;

  const handleLongFormFinish = (values: Record<string, unknown>) => {
    console.log('锚点分组表单提交', values);
  };

  const handleLongFormFailed = ({ errors }: { errors: Record<string, string[]> }) => {
    console.warn('锚点分组表单校验失败', errors);
  };

  const formSections: FormSectionConfig[] = [
    {
      key: 'f-1',
      label: '基础信息',
      accent: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
      description: '收集企业基础信息，后续组别会在此基础上补充经营与风险数据。',
      content: (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Form.Item
            name="companyName"
            label="企业名称"
            required
            rules={[{ required: true, message: '请填写企业名称' }]}
          >
            <Input.Text placeholder="例如：上海示例科技有限公司" />
          </Form.Item>
          <Form.Item
            name="creditCode"
            label="统一社会信用代码"
            required
            rules={[{ required: true, message: '请填写统一社会信用代码' }]}
          >
            <Input.Text placeholder="9131************" />
          </Form.Item>
          <Form.Item
            name="province"
            label="注册省份"
            required
            rules={[{ required: true, message: '请选择注册省份' }]}
          >
            <Input.Select placeholder="请选择注册省份" options={provinceOptions} />
          </Form.Item>
          <Form.Item
            name="foundedAt"
            label="成立日期"
            rules={[{ required: true, message: '请选择成立日期' }]}
          >
            <Input.Date />
          </Form.Item>
          <Form.Item
            name="industry"
            label="主营行业"
            rules={[{ required: true, message: '请选择主营行业' }]}
          >
            <Input.Select placeholder="请选择主营行业" options={industryOptions} />
          </Form.Item>
          <Form.Item
            name="contactName"
            label="联系人"
            rules={[{ required: true, message: '请填写联系人姓名' }]}
          >
            <Input.Text placeholder="张三" />
          </Form.Item>
          <Form.Item
            name="contactPhone"
            label="联系电话"
            rules={[{ required: true, message: '请填写联系电话' }]}
          >
            <Input.Text placeholder="例如：138****0000" />
          </Form.Item>
          <Form.Item
            name="address"
            label="联系地址"
            className="md:col-span-2"
            rules={[{ required: true, message: '请填写联系地址' }]}
          >
            <Input.Text placeholder="上海市浦东新区测试路 88 号" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'f-2',
      label: '经营概况',
      accent: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
      description: '通过经营指标与业务说明评估企业的持续经营能力与市场表现。',
      content: (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Form.Item
            name="lastYearRevenue"
            label="上年度营业额"
            rules={[{ required: true, message: '请填写上年度营业额' }]}
          >
            <Input.Number placeholder="单位：万元" min={0} step={0.01} precision={2} />
          </Form.Item>
          <Form.Item
            name="staffSize"
            label="员工规模"
            rules={[{ required: true, message: '请填写员工规模' }]}
          >
            <Input.Number placeholder="请输入人数" min={0} precision={0} />
          </Form.Item>
          <Form.Item
            name="businessHighlights"
            label="业务亮点"
            className="md:col-span-2"
          >
            <Input.Text placeholder="例如：核心客户、技术优势、行业地位" />
          </Form.Item>
          <Form.Item
            name="coreProducts"
            label="核心产品 / 服务"
            className="md:col-span-2"
            rules={[{ required: true, message: '请描述核心产品或服务' }]}
          >
            <Input.TextArea rows={4} placeholder="描述核心产品、主要客户、合作模式等信息" />
          </Form.Item>
          <Form.Item
            name="futurePlan"
            label="未来 12 个月业务计划"
            className="md:col-span-2"
          >
            <Input.TextArea rows={4} placeholder="填写计划中的市场拓展、产品迭代或融资动作" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'f-3',
      label: '风险排查',
      accent: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
      description: '聚焦司法风险、经营风险与内部治理，为风险控制提供辅助依据。',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Form.Item
              name="hasLawsuit"
              label="是否存在司法诉讼"
              required
              rules={[{ required: true, message: '请选择诉讼情况' }]}
            >
              <RadioGroup
                name="hasLawsuit"
                options={[
                  { value: 'no', label: '无' },
                  { value: 'yes', label: '有' },
                ]}
                inline
              />
            </Form.Item>
            <Form.Item
              name="overdueStatus"
              label="近三月逾期记录"
              required
              rules={[{ required: true, message: '请选择逾期记录' }]}
            >
              <Input.Select placeholder="请选择逾期记录" options={overdueOptions} />
            </Form.Item>
          </div>
          <Form.Item
            name="riskTags"
            label="风险标签"
            extra="可多选，帮助风险团队快速聚焦重点"
          >
            <CheckboxGroup name="riskTags" options={riskTagOptions} />
          </Form.Item>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Form.Item
              name="riskNotes"
              label="风险说明"
              className="md:col-span-2"
            >
              <Input.TextArea rows={5} placeholder="补充说明风险事件、处置进展或已采取的缓释措施" />
            </Form.Item>
            <Form.Item
              name="confirmOwner"
              label="负责人确认"
              className="md:col-span-2"
              rules={[{
                validator: (value) => (value ? undefined : '请完成负责人确认'),
              }]}
            >
              <Switch />
            </Form.Item>
          </div>
        </div>
      ),
    },
    {
      key: 'f-4',
      label: '通知与确认',
      accent: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200',
      description: '配置风控预警通知渠道及最终确认信息，完成长表单的最后流程。',
      content: (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Form.Item
            name="warningContact"
            label="预警联系人"
            required
            rules={[{ required: true, message: '请填写预警联系人' }]}
          >
            <Input.Text placeholder="例如：李四" />
          </Form.Item>
          <Form.Item
            name="contactEmail"
            label="通知邮箱"
            required
            rules={[
              { required: true, message: '请输入通知邮箱' },
              {
                pattern: /^(?:[a-zA-Z0-9_.-]+)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}$/,
                message: '请输入有效的邮箱地址',
              },
            ]}
          >
            <Input.Text placeholder="warning@example.com" />
          </Form.Item>
          <Form.Item
            name="alarmChannels"
            label="通知渠道"
            className="md:col-span-2"
            rules={[{
              validator: (value) => (Array.isArray(value) && value.length > 0 ? undefined : '请至少选择一个通知渠道'),
            }]}
          >
            <CheckboxGroup name="alarmChannels" options={alarmChannelOptions} inline />
          </Form.Item>
          <Form.Item
            name="otherChannels"
            label="其他通知方式"
            className="md:col-span-2"
          >
            <Input.TextArea rows={3} placeholder="例如：短信、企业微信等渠道的配置说明" />
          </Form.Item>
          <Form.Item
            name="agreeTerms"
            label="协议确认"
            className="md:col-span-2"
            rules={[{
              validator: (value) => (value ? undefined : '请确认风险控制相关协议条款'),
            }]}
          >
            <Switch />
          </Form.Item>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" variant="primary">
              保存并提交风控信息
            </Button>
          </div>
        </div>
      ),
    },
  ];

  const itemsForm = formSections.map(({ key, label, accent, description, content }) => ({
    key,
    label,
    content: (
      <FormSection title={label} description={description} accentClass={accent}>
        {content}
      </FormSection>
    ),
  }));

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">锚点定位</div>}
    >
      <div className="space-y-10">
        <Card>
          <div className="text-base font-medium mb-3">基础示例（3 段）</div>
          <Anchor className="min-h-[520px] max-h-[520px] h-[520px]" items={itemsBasic} />
        </Card>

        <Card>
          <div className="text-base font-medium mb-3">多章节（10 段，吸顶对齐）</div>
          <Anchor className="min-h-[520px] max-h-[520px] h-[520px]" items={itemsMany} tailSpacer />
        </Card>

        <Card>
          <div className="text-base font-medium mb-3">极端高度混排（吸顶稳定）</div>
          <Anchor className="min-h-[520px] max-h-[520px] h-[520px]" items={itemsExtreme} tailSpacer />
        </Card>

        <Card>
          <div className="text-base font-medium mb-3">分组长表单（锚点快速跳转）</div>
          <Form
            ref={formRef}
            layout="vertical"
            initialValues={longFormInitialValues}
            onFinish={handleLongFormFinish}
            onFinishFailed={handleLongFormFailed}
          >
            <Anchor
              className="min-h-[600px] max-h-[600px] h-[600px]"
              items={itemsForm}
              tailSpacer
            />
          </Form>
        </Card>
      </div>
    </Layout>
  );
}
