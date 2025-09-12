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
    <Layout menuItems={menuItems} footerItems={footerItems} header={<div className="text-xl font-semibold text-gray-800">Form Demo</div>}>
      <div className="space-y-6">
        <Card title="Layout">
          <div className="flex items-center gap-4">
            <Button variant={layout === 'vertical' ? 'primary' : 'default'} onClick={() => setLayout('vertical')}>Vertical</Button>
            <Button variant={layout === 'horizontal' ? 'primary' : 'default'} onClick={() => setLayout('horizontal')}>Horizontal</Button>
          </div>
        </Card>

        <Card title="Form">
          <Form
            layout={layout}
            labelWidth={120}
            initialValues={{
              username: '',
              age: 30,
              password: '',
              gender: 'male',
              hobbies: ['read'],
              agree: true,
              city: '',
              birthday: '',
              period: [undefined, undefined],
              bio: '',
              volume: 30,
            }}
            onFinish={(values) => {
              console.log('finish', values);
              alert('Submitted\n' + JSON.stringify(values, null, 2));
            }}
            onFinishFailed={() => {
              alert('Please fix validation errors');
            }}
          >
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12 md:col-span-6">
                <Form.Item name="username" label="Username" required rules={[{ min: 2, message: 'Min length 2' }]}>
                  <Input.Text placeholder="Enter username" clearable />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="age" label="Age" rules={[{ min: 0, message: 'Must be >= 0' }]}
                  getValueFromEvent={(v: number | null) => v}
                >
                  <Input.Number placeholder="Enter age" min={0} precision={0} />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="password" label="Password" required rules={[{ min: 6, message: 'Min length 6' }]}>
                  <Input.Password placeholder="Enter password" />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="gender" label="Gender" required>
                  <RadioGroup
                    name="gender"
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other' },
                    ]}
                    inline
                  />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="hobbies" label="Hobbies" required>
                  <CheckboxGroup
                    name="hobbies"
                    options={[
                      { value: 'read', label: 'Reading' },
                      { value: 'sport', label: 'Sport' },
                      { value: 'music', label: 'Music' },
                    ]}
                    inline
                  />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="agree" label="Agree" valuePropName="checked">
                  <Switch label="" />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="city" label="City" rules={[{ required: true, message: 'Please choose a city' }]}>
                  <Input.Select placeholder="Choose city" options={[
                    { value: 'sh', label: 'Shanghai' },
                    { value: 'bj', label: 'Beijing' },
                    { value: 'gz', label: 'Guangzhou' },
                  ]} />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item name="birthday" label="Birthday">
                  <Input.Date />
                </Form.Item>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Form.Item
                  name="period"
                  label="Period"
                  getValueFromEvent={(start?: string, end?: string) => [start, end] as [string|undefined,string|undefined]}
                >
                  <Input.DateRange />
                </Form.Item>
              </div>

              <div className="col-span-12">
                <Form.Item name="bio" label="Bio" rules={[{ max: 200, message: 'Max 200 chars' }]}>
                  <Input.TextArea placeholder="Say something..." autoGrow />
                </Form.Item>
              </div>

              <div className="col-span-12">
                <Form.Item
                  name="volume"
                  label="Volume"
                  getValueFromEvent={(e: React.ChangeEvent<HTMLInputElement>) => Number(e.target.value)}
                  normalize={(v) => (typeof v === 'number' ? Math.min(100, Math.max(0, v)) : v)}
                >
                  <Slider min={0} max={100} defaultValue={30} />
                </Form.Item>
              </div>

              <div className="col-span-12">
                <Button type="submit" variant="primary">Submit</Button>
              </div>
            </div>
          </Form>
        </Card>
      </div>
    </Layout>
  );
}

