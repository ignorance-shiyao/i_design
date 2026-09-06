import { useState } from 'react';
import {
  Button, Checkbox, Form, FormField, Input, RadioGroup, Select, Space, Switch, Table, Tag,
  Textarea, message, useForm, type TableSort,
} from '@i-design/react';
import type { DocEntry } from './types.js';

function InputDemo() {
  const [value, setValue] = useState('');
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <Input value={value} onChange={setValue} clearable showCount maxlength={40} placeholder="可清除、带字数统计" />
      <Input status="danger" defaultValue="错误状态" />
      <Input disabled defaultValue="禁用状态" />
      <Textarea autosize minRows={2} maxRows={6} showCount maxlength={120} placeholder="输入多行，高度会自动增长" />
    </div>
  );
}

function ToggleDemo() {
  const [checked, setChecked] = useState(true);
  const [plan, setPlan] = useState('pro');
  const [fruit, setFruit] = useState<string | null>('apple');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 420 }}>
      <Space gap="l">
        <Checkbox checked={checked} onChange={setChecked}>同意条款</Checkbox>
        <Checkbox checked={false} indeterminate>半选</Checkbox>
        <Checkbox disabled>禁用</Checkbox>
      </Space>
      <Space gap="l">
        <Switch defaultChecked label="深色模式" />
        <Switch size="s" label="小号" />
        <Switch disabled label="禁用" />
      </Space>
      <RadioGroup
        variant="button"
        value={plan}
        onChange={setPlan}
        options={[
          { value: 'free', label: '免费版' },
          { value: 'pro', label: '专业版' },
          { value: 'ent', label: '企业版', disabled: true },
        ]}
      />
      <Select
        clearable
        value={fruit}
        onChange={setFruit}
        options={[
          { value: 'apple', label: '苹果' },
          { value: 'banana', label: '香蕉' },
          { value: 'cherry', label: '樱桃（禁用）', disabled: true },
        ]}
      />
    </div>
  );
}

function FormDemo() {
  const form = useForm({
    initialValues: { name: '', email: '', bio: '' },
    rules: {
      name: [{ required: true, message: '请填写姓名' }, { min: 2, message: '至少 2 个字' }],
      email: [
        { required: true, message: '请填写邮箱' },
        { pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: '邮箱格式不正确' },
        {
          validator: async (value: string) => {
            await new Promise((resolve) => setTimeout(resolve, 400));
            return value === 'taken@example.com' ? '该邮箱已被注册' : null;
          },
        },
      ],
      bio: [{ max: 60, message: '不超过 60 字' }],
    },
    onSubmit: (values) => message.success(`提交成功：${values.name}`),
  });

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <Form form={form}>
        <FormField<string> name="name" label="姓名" required>
          {(f) => <Input value={f.value} onChange={f.onChange} onBlur={f.onBlur} />}
        </FormField>
        <FormField<string> name="email" label="邮箱" required help="填 taken@example.com 触发异步校验">
          {(f) => <Input value={f.value} onChange={f.onChange} onBlur={f.onBlur} />}
        </FormField>
        <FormField<string> name="bio" label="简介">
          {(f) => <Textarea autosize maxlength={60} showCount value={f.value} onChange={f.onChange} onBlur={f.onBlur} />}
        </FormField>
        <Space>
          <Button status="brand" type="submit" loading={form.state.submitting}>提交</Button>
          <Button variant="outline" onClick={() => form.reset()}>重置</Button>
          {form.isDirty && <Tag status="warning">未保存</Tag>}
        </Space>
      </Form>
    </div>
  );
}

const ORDERS = [
  { id: 'o-1', customer: '张三', amount: 1280, status: '已完成' },
  { id: 'o-2', customer: 'Alan Turing', amount: 9400, status: '处理中' },
  { id: 'o-3', customer: '李四', amount: 320, status: '已取消' },
  { id: 'o-4', customer: 'Ada Lovelace', amount: 5600, status: '已完成' },
];
const TONE: Record<string, 'success' | 'warning' | 'danger'> = { 已完成: 'success', 处理中: 'warning', 已取消: 'danger' };

function TableDemo() {
  const [sort, setSort] = useState<TableSort | null>({ key: 'amount', order: 'desc' });
  const [selected, setSelected] = useState<string[]>(['o-2']);
  return (
    <div style={{ width: '100%' }}>
      <Table
        striped
        selection="multiple"
        sort={sort}
        selectedKeys={selected}
        onSortChange={setSort}
        onSelectionChange={setSelected}
        rowKey={(row) => row.id}
        columns={[
          { key: 'id', title: '订单号', width: 110, fixed: 'start' },
          { key: 'customer', title: '客户', sortable: true },
          { key: 'amount', title: '金额', sortable: true, align: 'end' },
          { key: 'status', title: '状态' },
        ]}
        data={ORDERS}
        renderCell={(column, row) =>
          column.key === 'amount'
            ? `¥${(row.amount as number).toLocaleString()}`
            : column.key === 'status'
              ? <Tag status={TONE[row.status as string]}>{row.status as string}</Tag>
              : undefined
        }
      />
    </div>
  );
}

export const formEntries: DocEntry[] = [
  {
    id: 'input',
    name: 'Input / Textarea',
    cn: '输入框',
    category: '数据录入',
    description: '受控与非受控两种用法。Textarea 的 autosize 在 core 里只负责算高度上下界，读 scrollHeight 的动作留给各自框架的生命周期。',
    whenToUse: [
      '单行短文本用 Input，多行或长度不确定的内容用 Textarea 并开启 autosize。',
      '需要校验时交给 Form 管理，不要在组件上手写 status 与错误文案。',
    ],
    demos: [
      {
        caption: '状态与自动增高',
        render: () => <InputDemo />,
        react: `const [value, setValue] = useState('');

<Input value={value} onChange={setValue} clearable showCount maxlength={40} />
<Textarea autosize minRows={2} maxRows={6} showCount maxlength={120} />`,
        vue: `<script setup lang="ts">
import { ref } from 'vue';
const value = ref('');
</script>

<template>
  <IInput v-model="value" clearable show-count :maxlength="40" />
  <ITextarea autosize :min-rows="2" :max-rows="6" show-count :maxlength="120" />
</template>`,
      },
    ],
    props: [
      { name: 'value / v-model', type: 'string', desc: '受控值；React 传 value，Vue 用 v-model' },
      { name: 'defaultValue', type: 'string', default: `''`, desc: '非受控初始值' },
      { name: 'clearable', type: 'boolean', default: 'false', desc: '有值时显示清除按钮' },
      { name: 'showCount', type: 'boolean', default: 'false', desc: '配合 maxlength 显示字数' },
      { name: 'status', type: `'default' | 'success' | 'warning' | 'danger'`, default: `'default'`, desc: '校验状态，danger 会带上 aria-invalid' },
      { name: 'autosize', type: 'boolean', default: 'false', desc: 'Textarea：在 minRows~maxRows 之间自动增高' },
    ],
  },
  {
    id: 'select',
    name: 'Checkbox / Switch / Radio / Select',
    cn: '选择器',
    category: '数据录入',
    description: 'RadioGroup、Tabs、Select 共用 core 的同一个 roving tabindex 引擎：一组控件只占一个 Tab 停靠点，方向键在组内移动。Select 是完整的 WAI-ARIA combobox，支持首字母跳转。',
    whenToUse: [
      '选项少于 5 个且需要一眼看全，用 RadioGroup；更多选项用 Select。',
      '二元开关用 Switch（立即生效），需要提交才生效的用 Checkbox。',
      '多选且选项不多时用 Checkbox 组，选项很多时用 Select 的多选形态。',
    ],
    demos: [
      {
        caption: '四类选择控件',
        render: () => <ToggleDemo />,
        react: `<Checkbox checked={checked} onChange={setChecked}>同意条款</Checkbox>
<Switch defaultChecked label="深色模式" />

<RadioGroup variant="button" value={plan} onChange={setPlan}
  options={[{ value: 'free', label: '免费版' }, { value: 'pro', label: '专业版' }]} />

<Select clearable value={fruit} onChange={setFruit}
  options={[{ value: 'apple', label: '苹果' }, { value: 'banana', label: '香蕉' }]} />`,
        vue: `<ICheckbox v-model="checked">同意条款</ICheckbox>
<ISwitch v-model="dark">深色模式</ISwitch>

<IRadioGroup v-model="plan" variant="button"
  :options="[{ value: 'free', label: '免费版' }, { value: 'pro', label: '专业版' }]" />

<ISelect v-model="fruit" clearable
  :options="[{ value: 'apple', label: '苹果' }, { value: 'banana', label: '香蕉' }]" />`,
      },
    ],
    props: [
      { name: 'options', type: 'Array<{ value, label, disabled? }>', desc: 'RadioGroup / Select 的选项' },
      { name: 'variant', type: `'default' | 'button'`, default: `'default'`, desc: 'RadioGroup：button 为分段控件样式' },
      { name: 'orientation', type: `'horizontal' | 'vertical'`, default: `'horizontal'`, desc: '方向键的轴向' },
      { name: 'indeterminate', type: 'boolean', default: 'false', desc: 'Checkbox 半选，会上报 aria-checked="mixed"' },
      { name: 'clearable', type: 'boolean', default: 'false', desc: 'Select：已选时显示清除' },
    ],
  },
  {
    id: 'form',
    name: 'Form',
    cn: '表单校验',
    category: '数据录入',
    description: '校验规则是可序列化的纯数据，可以来自配置或服务端。FormStore 是框架无关的可订阅 store：React 用 useSyncExternalStore 接、Vue 用 shallowRef 接，校验顺序与异步语义只有一份实现。',
    whenToUse: [
      '任何需要校验、提交、重置的表单场景。',
      '规则写成数据而不是回调，这样同一份规则可以来自配置、服务端，也可以在测试里单独跑。',
      '异步校验（如查重）直接返回 Promise，不需要额外的防抖状态。',
    ],
    demos: [
      {
        caption: '同步 + 异步规则',
        render: () => <FormDemo />,
        react: `const form = useForm({
  initialValues: { name: '', email: '' },
  rules: {
    name: [{ required: true, message: '请填写姓名' }, { min: 2 }],
    email: [
      { required: true },
      { pattern: /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/, message: '邮箱格式不正确' },
      { validator: async (v) => (await isTaken(v)) ? '该邮箱已被注册' : null },
    ],
  },
  onSubmit: (values) => save(values),
});

<Form form={form}>
  <FormField<string> name="email" label="邮箱" required>
    {(f) => <Input value={f.value} onChange={f.onChange} onBlur={f.onBlur} />}
  </FormField>
  <Button type="submit" status="brand" loading={form.state.submitting}>提交</Button>
</Form>`,
        vue: `<script setup lang="ts">
import { useForm, IForm, IFormField, IInput, IButton } from '@i-design/vue';

const form = useForm({
  initialValues: { name: '', email: '' },
  rules: {
    name: [{ required: true, message: '请填写姓名' }, { min: 2 }],
    email: [
      { required: true },
      { pattern: /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/, message: '邮箱格式不正确' },
      { validator: async (v) => (await isTaken(v)) ? '该邮箱已被注册' : null },
    ],
  },
  onSubmit: (values) => save(values),
});
</script>

<template>
  <IForm :form="form">
    <IFormField name="email" label="邮箱" required v-slot="f">
      <IInput :model-value="f.value" @update:model-value="f.onChange" @blur="f.onBlur" />
    </IFormField>
    <IButton type="submit" status="brand" :loading="form.state.value.submitting">提交</IButton>
  </IForm>
</template>`,
      },
    ],
    props: [
      { name: 'rules', type: 'Record<field, Rule[]>', desc: '规则数组，按顺序执行，返回第一个错误' },
      { name: 'Rule.required', type: 'boolean', desc: '空值校验；0 与 false 不算空' },
      { name: 'Rule.min / max / len', type: 'number', desc: '字符串按长度、数字按大小' },
      { name: 'Rule.pattern', type: 'RegExp', desc: '正则校验，空值时跳过' },
      { name: 'Rule.validator', type: '(value, values) => string | null | Promise', desc: '自定义/异步校验' },
      { name: 'Rule.trigger', type: `'change' | 'blur' | 'submit'`, desc: '限定触发时机，默认全部' },
    ],
  },
  {
    id: 'table',
    name: 'Table',
    cn: '表格',
    category: '数据录入',
    description: '排序、多选、固定列、粘性表头都在 core 里算好。本地排序会复制数组而不是原地改，空值在升序降序里都排最后；可排序表头带 aria-sort 且支持键盘操作。',
    whenToUse: [
      '需要对比、排序、批量操作的结构化数据。',
      '数据量大时开启 stickyHeader；列很多时用 fixed 固定关键列。',
      '服务端排序请开 manualSort，组件不会再本地排一次。',
    ],
    demos: [
      {
        caption: '排序 / 多选 / 固定列',
        render: () => <TableDemo />,
        react: `<Table
  striped
  selection="multiple"
  rowKey={(row) => row.id}
  sort={sort} onSortChange={setSort}
  selectedKeys={selected} onSelectionChange={setSelected}
  columns={[
    { key: 'id', title: '订单号', width: 110, fixed: 'start' },
    { key: 'amount', title: '金额', sortable: true, align: 'end' },
  ]}
  data={orders}
  renderCell={(column, row) =>
    column.key === 'status' ? <Tag status={tone[row.status]}>{row.status}</Tag> : undefined}
/>`,
        vue: `<ITable
  striped
  selection="multiple"
  :row-key="(row) => row.id"
  v-model:sort="sort"
  v-model:selected-keys="selected"
  :columns="columns"
  :data="orders"
>
  <template #cell-status="{ row }">
    <ITag :status="tone[row.status]">{{ row.status }}</ITag>
  </template>
</ITable>`,
      },
    ],
    props: [
      { name: 'columns', type: 'TableColumn[]', desc: 'key / title / width / align / sortable / sorter / fixed / ellipsis' },
      { name: 'rowKey', type: '(row, index) => string', desc: '行唯一键，选择状态据此计算' },
      { name: 'sort', type: '{ key, order } | null', desc: '受控排序；不传则组件自持' },
      { name: 'manualSort', type: 'boolean', default: 'false', desc: '服务端排序时关闭本地排序' },
      { name: 'selection', type: `'none' | 'single' | 'multiple'`, default: `'none'`, desc: '选择模式' },
      { name: 'stickyHeader', type: 'boolean', default: 'false', desc: '粘性表头' },
    ],
  },
];
