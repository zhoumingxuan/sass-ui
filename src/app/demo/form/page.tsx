"use client";

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import Switch from '@/components/Switch';
import { RadioGroup } from '@/components/Radio';
import { CheckboxGroup } from '@/components/Checkbox';
import Slider from '@/components/Slider';
import Form from '@/components/form';
import { menuItems, footerItems } from '@/components/menuItems';
import { useState } from 'react';

export default function FormDemo() {
  const [layout, setLayout] = useState<'vertical'|'horizontal'>('vertical');

  return (
    <Layout menuItems={menuItems} footerItems={footerItems} header={<div className="text-xl font-semibold text-gray-800">表单示例</div>}>
      <div className="space-y-6">
        <Card title="布局切换">
          <div className="flex items-center gap-4">
            <Button variant={layout === 'vertical' ? 'primary' : 'default'} onClick={() => setLayout('vertical')}>垂直布局</Button>
            <Button variant={layout === 'horizontal' ? 'primary' : 'default'} onClick={() => setLayout('horizontal')}>水平布局</Button>
          </div>
        </Card>

        <Card title="综合表单">
          <Form
            layout={layout}
            labelWidth={120}
            initialValues={{
              username: '',
              age: 30,
              password: '',
              gender: 'male',
              hobbies: ['read'],
              agree: false,
              city: '',
              birthday: '',
              period: [undefined, undefined],
              bio: '',
              volume: 30,
            }}
            onFinish={(values) => {
              console.log('finish', values);
              alert('提交成功\n' + JSON.stringify(values, null, 2));
            }}
            onFinishFailed={({ errors }) => {
              console.warn('failed', errors);
              alert('请修正校验错误后再提交');
            }}
          >
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12 md:col-span-6">
                <Form.Item name="username" label="用户名" required rules={[{ min: 2, message: '至少 2 个字符' }]}>
                  <Input.Text placeholder="请输入用户名" clearable />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="age" label="年龄" rules={[{ min: 0, message: '不能小于 0' }]}>
                  <Input.Number placeholder="请输入年龄" min={0} precision={0} />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="password" label="密码" required rules={[{ min: 6, message: '至少 6 位' }]}>
                  <Input.Password placeholder="请输入密码" />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="gender" label="性别" required>
                  <RadioGroup
                    name="gender"
                    options={[
                      { value: 'male', label: '男' },
                      { value: 'female', label: '女' },
                      { value: 'other', label: '其他' },
                    ]}
                    inline
                  />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="hobbies" label="爱好" required>
                  <CheckboxGroup
                    name="hobbies"
                    options={[
                      { value: 'read', label: '阅读' },
                      { value: 'sport', label: '运动' },
                      { value: 'music', label: '音乐' },
                    ]}
                    inline
                  />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="agree" label="是否同意" valuePropName="checked" rules={[{ validator: (v) => (v ? undefined : '请勾选同意') }]}>
                  <Switch label="" />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="city" label="所在城市" rules={[{ required: true, message: '请选择城市' }]}>
                  <Input.Select placeholder="请选择城市" options={[
                    { value: 'sh', label: '上海' },
                    { value: 'bj', label: '北京' },
                    { value: 'gz', label: '广州' },
                  ]} />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="birthday" label="生日" rules={[{ required: true, message: '请选择日期' }]}>
                  <Input.Date />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="period" label="有效期" rules={[{ validator: (v) => (Array.isArray(v) && v[0] && v[1]) ? undefined : '请选择起止日期' }]}>
                  <Input.DateRange />
                </Form.Item>
              </div>

              <div className="col-span-12">
                <Form.Item name="bio" label="个人简介" rules={[{ max: 200, message: '最多 200 字' }]}>
                  <Input.TextArea placeholder="说点什么..." autoGrow />
                </Form.Item>
              </div>

              <div className="col-span-12">
                <Form.Item
                  name="volume"
                  label="音量"
                  normalize={(v) => (typeof v === 'number' ? Math.min(100, Math.max(0, v)) : (typeof v === 'string' ? Number(v) : v))}
                >
                  <Slider min={0} max={100} defaultValue={30} />
                </Form.Item>
              </div>

              <div className="col-span-12">
                <Button type="submit" variant="primary">提交</Button>
              </div>
            </div>
          </Form>
        </Card>
      </div>
    </Layout>
  );
}
