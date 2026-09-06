import { useState } from 'react';
import {
  Affix, AutoComplete, Button, ButtonGroup, Cascader, ColorPicker, Countdown, FloatButton,
  Image, InputOtp, InputTag, Link, PageHeader, Space, Splitter, TimePicker, Tour, Transfer,
  type CascaderNode, type TimeValue, type TransferItem,
} from '@i-design/react';
import type { DocEntry } from './types.js';

const TRANSFER_ITEMS: TransferItem[] = [
  { key: 'read', label: '读取数据', description: '查询与导出' },
  { key: 'write', label: '写入数据' },
  { key: 'deploy', label: '发布上线' },
  { key: 'billing', label: '账单管理' },
  { key: 'audit', label: '审计日志', disabled: true },
];

const REGIONS: CascaderNode[] = [
  {
    value: 'zhejiang', label: '浙江省',
    children: [
      { value: 'hangzhou', label: '杭州市', children: [{ value: 'xihu', label: '西湖区' }, { value: 'binjiang', label: '滨江区' }] },
      { value: 'ningbo', label: '宁波市', children: [{ value: 'yinzhou', label: '鄞州区' }] },
    ],
  },
  {
    value: 'jiangsu', label: '江苏省',
    children: [{ value: 'nanjing', label: '南京市', children: [{ value: 'gulou', label: '鼓楼区' }] }],
  },
  { value: 'taiwan', label: '台湾省', disabled: true },
];

function TransferDemo() {
  const [value, setValue] = useState<string[]>(['deploy']);
  return (
    <div style={{ width: '100%' }}>
      <Transfer items={TRANSFER_ITEMS} value={value} onChange={setValue} searchable titles={['可选权限', '已授予']} />
    </div>
  );
}

function CascaderDemo() {
  const [region, setRegion] = useState<string[]>(['zhejiang', 'hangzhou', 'xihu']);
  const [loose, setLoose] = useState<string[]>([]);
  return (
    <Space gap="l" wrap>
      <span style={{ width: 240 }}>
        <Cascader options={REGIONS} value={region} onChange={setRegion} clearable />
      </span>
      <span style={{ width: 240 }}>
        <Cascader options={REGIONS} value={loose} onChange={setLoose} changeOnSelect placeholder="可选到任意一级" />
      </span>
    </Space>
  );
}

function PickerDemo() {
  const [color, setColor] = useState('#4169ef');
  const [time, setTime] = useState<TimeValue | null>({ hour: 9, minute: 30 });
  return (
    <Space gap="l" wrap align="center">
      <ColorPicker value={color} onChange={setColor} showRamp />
      <span style={{ width: 180 }}>
        <TimePicker value={time} onChange={setTime} step={15} clearable />
      </span>
      <span style={{ color: 'var(--i-color-text-tertiary)', fontSize: 12 }}>
        取色器会由所选主色推导出完整的 10 级色阶
      </span>
    </Space>
  );
}

function TextEntryDemo() {
  const [keyword, setKeyword] = useState('');
  const [tags, setTags] = useState(['React', 'Vue']);
  const [otp, setOtp] = useState('');
  const pool = ['组件库', '组件设计', '设计令牌', '主题定制', '无障碍'];
  return (
    <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AutoComplete
        value={keyword}
        onChange={setKeyword}
        suggestions={pool.filter((item) => keyword !== '' && item.includes(keyword))}
        placeholder="输入「组件」试试"
      />
      <InputTag tags={tags} onChange={setTags} max={6} placeholder="回车或逗号添加标签" />
      <InputOtp value={otp} onChange={setOtp} length={6} />
    </div>
  );
}

function MediaDemo() {
  const [ratio, setRatio] = useState(38);
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Space gap="l" wrap align="center">
        <Image
          src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%234169ef'/%3E%3Cstop offset='1' stop-color='%236ce9a6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='320' height='180' fill='url(%23g)'/%3E%3C/svg%3E"
          alt="渐变示例图"
          width={200}
          ratio="16 / 9"
          preview
        />
        <span style={{ color: 'var(--i-color-text-tertiary)', fontSize: 12 }}>
          点击放大；预览层支持 + − r 与 Esc
        </span>
      </Space>
      <div style={{ blockSize: 160 }}>
        <Splitter value={ratio} onChange={setRatio} min={20} max={80}>
          {[
            <div key="a" style={{ padding: 16, background: 'var(--i-color-bg-container)' }}>左侧 {Math.round(ratio)}%</div>,
            <div key="b" style={{ padding: 16, background: 'var(--i-color-bg-container)' }}>右侧（拖动分隔条，或聚焦后按方向键）</div>,
          ]}
        </Splitter>
      </div>
    </div>
  );
}

function TourDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Space wrap>
        <Button id="tour-anchor-a" onClick={() => setOpen(true)}>开始导览</Button>
        <Button id="tour-anchor-b" variant="outline">第二个目标</Button>
      </Space>
      <Tour
        open={open}
        onClose={() => setOpen(false)}
        steps={[
          { target: '#tour-anchor-a', title: '第一步', description: '聚光灯会跟随目标元素，遮罩由一个超大 box-shadow 挖洞得到。' },
          { target: '#tour-anchor-b', title: '第二步', description: '← → 切换，Esc 退出。' },
        ]}
      />
    </div>
  );
}

function PartsDemo() {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="订单 #10241"
        subtitle="已支付"
        extra={<Button size="s" variant="outline">导出</Button>}
        onBack={() => undefined}
      />
      <Space gap="l" wrap align="center">
        <ButtonGroup>
          <Button variant="outline">左</Button>
          <Button variant="outline">中</Button>
          <Button variant="outline">右</Button>
        </ButtonGroup>
        <Link href="#advanced">普通链接</Link>
        <Link href="#advanced" status="danger" underline="always">危险链接</Link>
        <Link disabled>禁用链接</Link>
        <Countdown to={Date.now() + 3_600_000} label="距离结束" />
      </Space>
    </div>
  );
}

export const advancedEntries: DocEntry[] = [
  {
    id: 'transfer',
    name: 'Transfer',
    cn: '穿梭框',
    category: '数据录入',
    description: '在两个列表之间搬运条目。勾选是暂存、方向键是提交——两种状态分开，才不会出现「勾了却没生效」。',
    whenToUse: [
      '需要从一个较长的候选集中挑出一个子集，且用户要能一眼看清「已选」的全貌。',
      '权限、字段、成员这类需要双向增删的配置场景。',
      '如果候选项少于 8 个，多选 Select 或 Checkbox 组更轻。',
    ],
    demos: [
      {
        caption: '带搜索的双列穿梭',
        hint: '两侧各自独立搜索；禁用项不会被全选带走，移动后勾选态自动清除。',
        render: () => <TransferDemo />,
        react: `const [value, setValue] = useState(['deploy']);

<Transfer
  items={items}
  value={value}
  onChange={setValue}
  searchable
  titles={['可选权限', '已授予']}
/>`,
        vue: `<script setup>
const value = ref(['deploy']);
</script>

<template>
  <ITransfer
    :items="items"
    v-model="value"
    searchable
    :titles="['可选权限', '已授予']"
  />
</template>`,
      },
    ],
    props: [
      { name: 'items', type: 'TransferItem[]', desc: '全量候选项，{ key, label, disabled?, description? }' },
      { name: 'value', type: 'string[]', desc: '位于右侧的 key 集合（v-model / 受控）' },
      { name: 'titles', type: '[string, string]', default: "['源列表', '目标列表']", desc: '两侧面板标题' },
      { name: 'searchable', type: 'boolean', default: 'false', desc: '每侧各带一个独立搜索框' },
      { name: 'onChange', type: '(value: string[]) => void', desc: '搬运完成后触发' },
    ],
  },
  {
    id: 'cascader',
    name: 'Cascader',
    cn: '级联选择',
    category: '数据录入',
    description: '一次选出一条路径。列由「正在浏览的路径」推导，而不是由已选值——所以回看上一级时不会把选中值弄丢。',
    whenToUse: [
      '数据本身是层级的：省市区、组织架构、商品类目。',
      '需要把完整路径而不只是叶子节点存下来。',
      '层级只有两层且每层选项很少时，两个并排的 Select 更直白。',
    ],
    demos: [
      {
        caption: '省市区与任意层级',
        hint: '左边必须选到叶子；右边开了 changeOnSelect，停在任意一级都算数。',
        render: () => <CascaderDemo />,
        react: `<Cascader options={regions} value={region} onChange={setRegion} clearable />
<Cascader options={regions} value={loose} onChange={setLoose} changeOnSelect />`,
        vue: `<ICascader :options="regions" v-model="region" clearable />
<ICascader :options="regions" v-model="loose" change-on-select />`,
      },
    ],
    props: [
      { name: 'options', type: 'CascaderNode[]', desc: '树形选项，{ value, label, disabled?, children? }' },
      { name: 'value', type: 'string[]', desc: '完整路径，如 ["zhejiang", "hangzhou", "xihu"]' },
      { name: 'changeOnSelect', type: 'boolean', default: 'false', desc: '允许停在非叶子节点' },
      { name: 'separator', type: 'string', default: "' / '", desc: '回显时各级之间的分隔符' },
      { name: 'onChange', type: '(value: string[], labels: string[]) => void', desc: '同时给出路径与对应文案' },
    ],
  },
  {
    id: 'picker',
    name: 'ColorPicker / TimePicker',
    cn: '取色器 / 时间选择',
    category: '数据录入',
    description: '两个专用输入：一个把主色展开成完整色阶，一个用三列滚轮代替易错的文本掩码。',
    whenToUse: [
      '主题定制页需要让用户挑一个品牌色，并立刻看到派生的深浅档位。',
      '时间需要按 15 / 30 分钟这类粒度录入，而不是任意分钟。',
      '需要日期 + 时间时，把 DatePicker 与 TimePicker 并排使用。',
    ],
    demos: [
      {
        caption: '主色推导与步进时间',
        hint: '色阶由 HSL 明度曲线生成，第 5 档恒等于所选色；时间列按 step 抽稀。',
        render: () => <PickerDemo />,
        react: `<ColorPicker value={color} onChange={setColor} showRamp />
<TimePicker value={time} onChange={setTime} step={15} clearable />`,
        vue: `<IColorPicker v-model="color" show-ramp />
<ITimePicker v-model="time" :step="15" clearable />`,
      },
    ],
    props: [
      { name: 'showRamp', type: 'boolean', default: 'false', desc: 'ColorPicker：展示由主色推导的 10 级色阶' },
      { name: 'presets', type: 'string[]', desc: 'ColorPicker：预设色板' },
      { name: 'step', type: 'number', default: '1', desc: 'TimePicker：分 / 秒的粒度' },
      { name: 'showSeconds', type: 'boolean', default: 'false', desc: 'TimePicker：是否显示秒列' },
    ],
  },
  {
    id: 'text-entry',
    name: 'AutoComplete / InputTag / InputOtp',
    cn: '自动完成 / 标签输入 / 验证码',
    category: '数据录入',
    description: '三个文本输入的变体：建议但不限制、把文本切成标签、把一串数字铺成格子。',
    whenToUse: [
      'AutoComplete：任意文本都合法，候选只是提示（搜索框、邮箱域名补全）。若必须从候选中选，用 Select。',
      'InputTag：关键词、收件人、标签这类可增删的短文本集合。',
      'InputOtp：短信 / 邮箱验证码；背后仍是一个真实 input，粘贴与自动填充照常工作。',
    ],
    demos: [
      {
        caption: '三种输入变体',
        hint: 'AutoComplete 上下键循环高亮；InputTag 在空输入时按退格删掉上一个；InputOtp 满位触发 onComplete。',
        render: () => <TextEntryDemo />,
        react: `<AutoComplete value={keyword} onChange={setKeyword} suggestions={matches} />
<InputTag tags={tags} onChange={setTags} max={6} />
<InputOtp value={otp} onChange={setOtp} length={6} />`,
        vue: `<IAutoComplete v-model="keyword" :suggestions="matches" />
<IInputTag v-model="tags" :max="6" />
<IInputOtp v-model="otp" :length="6" @complete="verify" />`,
      },
    ],
    props: [
      { name: 'suggestions', type: 'string[]', desc: 'AutoComplete：候选列表，由外部按输入过滤' },
      { name: 'max', type: 'number', desc: 'InputTag：标签数量上限，达到后输入框自动禁用' },
      { name: 'length', type: 'number', default: '6', desc: 'InputOtp：验证码位数' },
      { name: 'onComplete', type: '(value: string) => void', desc: 'InputOtp：填满时触发，通常直接发起校验' },
    ],
  },
  {
    id: 'media',
    name: 'Image / Splitter',
    cn: '图片 / 分栏',
    category: '数据展示',
    description: '图片带占位、失败态与可缩放旋转的预览层；分栏用一根可拖动、也可用键盘操作的分隔条切分空间。',
    whenToUse: [
      '图片尺寸未知但布局不能跳动时，用 ratio 先占好位。',
      '需要让用户自行决定左右（或上下）空间配比的工作台界面。',
      '分隔条是 role="separator"，方向键 ±2%，Home / End 直达两端。',
    ],
    demos: [
      {
        caption: '预览与可拖拽分栏',
        hint: '预览层接管键盘：+ − 缩放、r 旋转、Esc 关闭；点击遮罩本身才会关闭。',
        render: () => <MediaDemo />,
        react: `<Image src={src} alt="示例" width={200} ratio="16 / 9" preview />

<Splitter value={ratio} onChange={setRatio} min={20} max={80}>
  {[<div key="a">左</div>, <div key="b">右</div>]}
</Splitter>`,
        vue: `<IImage :src="src" alt="示例" :width="200" ratio="16 / 9" preview />

<ISplitter v-model="ratio" :min="20" :max="80">
  <template #start><div>左</div></template>
  <template #end><div>右</div></template>
</ISplitter>`,
      },
    ],
    props: [
      { name: 'ratio', type: 'string', desc: 'Image：CSS aspect-ratio，用于加载前占位' },
      { name: 'preview', type: 'boolean', default: 'false', desc: 'Image：点击后打开可缩放 / 旋转的预览层' },
      { name: 'fit', type: "'cover' | 'contain' | 'fill' | 'none'", default: "'cover'", desc: 'Image：填充方式' },
      { name: 'value', type: 'number', desc: 'Splitter：第一栏占比（百分比）' },
      { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", desc: 'Splitter：切分方向' },
    ],
  },
  {
    id: 'tour',
    name: 'Tour',
    cn: '漫游引导',
    category: '反馈',
    description: '一次点亮一个元素，把新功能按顺序讲一遍。聚光灯是一个超大的 box-shadow 挖出来的洞，目标元素本身完全不被遮挡。',
    whenToUse: [
      '首次进入某个复杂页面，需要串起 3–5 个关键入口。',
      '发布新功能后，把改动位置指给老用户看。',
      '超过 6 步就该考虑写文档而不是做导览。',
    ],
    demos: [
      {
        caption: '两步导览',
        hint: '目标会先滚动到视口中央再测量；← → 切换，Esc 退出。',
        render: () => <TourDemo />,
        react: `<Tour
  open={open}
  onClose={() => setOpen(false)}
  steps={[
    { target: '#step-a', title: '第一步', description: '……' },
    { target: '#step-b', title: '第二步' },
  ]}
/>`,
        vue: `<ITour
  :open="open"
  :steps="steps"
  @close="open = false"
/>`,
      },
    ],
    props: [
      { name: 'steps', type: 'TourStep[]', desc: '{ target: CSS 选择器, title, description? }' },
      { name: 'open', type: 'boolean', desc: '是否显示' },
      { name: 'current', type: 'number', desc: '当前步序，不传则内部自管' },
      { name: 'onClose', type: '() => void', desc: '跳过、完成或按 Esc 时触发' },
    ],
  },
  {
    id: 'parts',
    name: 'PageHeader / ButtonGroup / Link / Countdown',
    cn: '页头 / 按钮组 / 链接 / 倒计时',
    category: '通用',
    description: '四个小件，负责页面骨架上反复出现的那几处：标题栏、成组操作、行内跳转、剩余时间。',
    whenToUse: [
      'PageHeader：详情页顶部的返回 + 标题 + 状态 + 操作区。',
      'ButtonGroup：一组互相关联的操作，视觉上连成一体。',
      'Link：行内跳转；禁用时会同时摘掉 href 并退出 Tab 序列。',
      'Countdown：限时活动、验证码重发、会话到期。',
    ],
    demos: [
      {
        caption: '页面骨架上的小件',
        hint: '倒计时归零时触发 onFinish，并且只触发一次。',
        render: () => <PartsDemo />,
        react: `<PageHeader title="订单 #10241" subtitle="已支付" onBack={goBack} extra={<Button size="s">导出</Button>} />

<ButtonGroup><Button>左</Button><Button>右</Button></ButtonGroup>
<Link href="/docs">文档</Link>
<Countdown to={deadline} label="距离结束" onFinish={reload} />`,
        vue: `<IPageHeader title="订单 #10241" subtitle="已支付" back @back="goBack">
  <template #extra><IButton size="s">导出</IButton></template>
</IPageHeader>

<IButtonGroup><IButton>左</IButton><IButton>右</IButton></IButtonGroup>
<ILink href="/docs">文档</ILink>
<ICountdown :to="deadline" label="距离结束" @finish="reload" />`,
      },
    ],
    props: [
      { name: 'onBack', type: '() => void', desc: 'PageHeader：传入才会渲染返回按钮' },
      { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", desc: 'ButtonGroup：排布方向' },
      { name: 'underline', type: "'always' | 'hover' | 'never'", default: "'hover'", desc: 'Link：下划线时机' },
      { name: 'to', type: 'number', desc: 'Countdown：目标时间戳（毫秒）' },
      { name: 'format', type: 'string', default: "'HH:mm:ss'", desc: 'Countdown：展示格式，支持 DD / HH / mm / ss' },
    ],
  },
  {
    id: 'affix-float',
    name: 'Affix / FloatButton',
    cn: '固钉 / 悬浮按钮',
    category: '导航',
    description: '两个「跟着视口走」的容器：固钉在滚过某条线后钉住并留出等高占位；悬浮按钮常驻右下角，可展开成一组。',
    whenToUse: [
      'Affix：长表单的提交栏、长表格的筛选条。',
      'FloatButton：全局的新建 / 客服 / 反馈入口。',
      '页面已有粘性头部时，把 offset 设成它的高度。',
    ],
    demos: [
      {
        caption: '固钉与悬浮入口',
        hint: 'Affix 钉住时会用一个等高占位撑住原位，页面因此不会突然向上跳一格。',
        render: () => (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Affix offset={72}>
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--i-color-brand-subtle)', color: 'var(--i-color-brand-text)' }}>
                向下滚动，这一条会钉在距顶部 72px 处
              </div>
            </Affix>
            <span style={{ color: 'var(--i-color-text-tertiary)', fontSize: 12 }}>
              右下角的悬浮按钮悬停即展开。
            </span>
            <FloatButton
              icon="plus"
              items={[
                { icon: 'edit', label: '新建' },
                { icon: 'search', label: '搜索' },
              ]}
            />
          </div>
        ),
        react: `<Affix offset={72}><Toolbar /></Affix>

<FloatButton icon="plus" items={[{ icon: 'edit', label: '新建' }]} />`,
        vue: `<IAffix :offset="72"><Toolbar /></IAffix>

<IFloatButton icon="plus" :items="[{ icon: 'edit', label: '新建' }]" />`,
      },
    ],
    props: [
      { name: 'offset', type: 'number', default: '0', desc: 'Affix：钉住时距视口顶部的距离' },
      { name: 'icon', type: 'IconName', default: "'plus'", desc: 'FloatButton：主按钮图标' },
      { name: 'items', type: 'Array<{ icon, label, onClick? }>', desc: 'FloatButton：传入后悬停展开为一组' },
    ],
  },
];
