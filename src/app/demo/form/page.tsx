"use client";

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import Switch from '@/components/Switch';
import { RadioGroup } from '@/components/Radio';
import { Checkbox, CheckboxGroup } from '@/components/Checkbox';
import Slider from '@/components/Slider';
import { useState } from 'react';
import { menuItems, footerItems } from '@/components/menuItems';

export default function FormDemo() {
  const [submitting, setSubmitting] = useState(false);
  const [agree, setAgree] = useState(true);
  const [gender, setGender] = useState('male');
  const [hobbies, setHobbies] = useState<string[]>(['read']);
  const allHobbyOptions = ['read', 'sport', 'music'];
  const allSelected = hobbies.length === allHobbyOptions.length;
  const someSelected = hobbies.length > 0 && !allSelected;
  const [volume, setVolume] = useState(30);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 1000);
  };
  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">表单示例</div>}
    >
      <Card title="输入控件">
        <form className="grid grid-cols-12 gap-4 md:gap-6" onSubmit={onSubmit}>
          <div className="col-span-12 md:col-span-6"><Input.Text label="文本输入" placeholder="请输入文本" clearable /></div>
          <div className="col-span-12 md:col-span-6"><Input.Number label="数字输入" placeholder="请输入数字" step={5} min={0} max={100} precision={0} /></div>
          <div className="col-span-12 md:col-span-6"><Input.Password label="密码输入" placeholder="请输入密码" /></div>
          <div className="col-span-12 md:col-span-6">
            <Input.Select label="选择输入" placeholder="请选择" clearable options={[{ value: '', label: '请选择', disabled: true }, { value: '1', label: '选项1' }, { value: '2', label: '选项2' }]} />
          </div>
          <div className="col-span-12 md:col-span-6"><Input.Date label="日期输入" /></div>
          <div className="col-span-12 md:col-span-6"><Input.DateRange label="日期范围" /></div>

          <div className="col-span-12 md:col-span-6">
            <Switch label="是否同意" description={agree ? '已同意' : '未同意'} checked={agree} onChange={setAgree} />
          </div>
          <div className="col-span-12 md:col-span-6">
            <div className="flex items-center gap-6">
              <Switch size="small" label="小号" defaultChecked />
              <Switch size="medium" label="中号" />
              <Switch size="large" label="大号" />
            </div>
          </div>

          <div className="col-span-12 md:col-span-6">
            <RadioGroup
              name="gender"
              label="单选（性别）"
              value={gender}
              onChange={setGender}
              options={[
                { value: 'male', label: '男' },
                { value: 'female', label: '女' },
                { value: 'other', label: '其他' },
              ]}
              inline
            />
          </div>

          <div className="col-span-12 md:col-span-6">
            <CheckboxGroup
              name="hobbies"
              label="多选（爱好）"
              values={hobbies}
              onChange={setHobbies}
              options={[
                { value: 'read', label: '阅读' },
                { value: 'sport', label: '运动' },
                { value: 'music', label: '音乐' },
              ]}
              inline
            />
          </div>

          <div className="col-span-12 md:col-span-6">
            <div className="mb-2 text-xs text-gray-500">三态选择示例（全选 / 部分 / 全不选）</div>
            <div className="space-y-2">
              <Checkbox
                label="全选爱好"
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(e) => {
                  const checked = (e.target as HTMLInputElement).checked;
                  setHobbies(checked ? allHobbyOptions : []);
                }}
              />
            </div>
          </div>

          <div className="col-span-12 md:col-span-6">
            <RadioGroup
              name="gender-disabled"
              label="单选（禁用示例）"
              value={gender}
              onChange={setGender}
              options={[
                { value: 'male', label: '男' },
                { value: 'female', label: '女' },
                { value: 'other', label: '其他' },
              ]}
              disabled
              inline
            />
          </div>

          <div className="col-span-12 md:col-span-6">
            <CheckboxGroup
              name="hobbies-disabled"
              label="多选（禁用示例）"
              values={hobbies}
              onChange={setHobbies}
              options={[
                { value: 'read', label: '阅读' },
                { value: 'sport', label: '运动' },
                { value: 'music', label: '音乐' },
              ]}
              disabled
              inline
            />
          </div>

          <div className="col-span-12">
            <Input.TextArea label="文本域" placeholder="请输入更多内容…" helper="支持自动高度" autoGrow />
          </div>

          <div className="col-span-12">
            <Slider
              label="滑动输入条（音量）"
              min={0}
              max={100}
              step={1}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </div>
          <div className="col-span-12">
            <Button type="submit" disabled={submitting}>{submitting ? '提交中…' : '提交'}</Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
