import { useState } from 'react';
import {
  Breadcrumb, Button, Carousel, Collapse, Dialog, Drawer, Pagination, Space, Steps, Tabs,
  Transition, message,
} from '@i-design/react';
import type { DocEntry } from './types.js';

function TabsDemo() {
  const [tab, setTab] = useState('a');
  return (
    <div style={{ width: '100%' }}>
      <Tabs
        variant="segment"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'a', label: '概览' },
          { value: 'b', label: '详情' },
          { value: 'c', label: '禁用', disabled: true },
        ]}
      >
        {(item) => <div style={{ paddingTop: 8 }}>面板内容：{item.label}（← → 方向键可切换）</div>}
      </Tabs>
    </div>
  );
}

function OverlayDemo() {
  const [dialog, setDialog] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [visible, setVisible] = useState(true);
  return (
    <>
      <Space wrap>
        <Button onClick={() => setDialog(true)}>打开对话框</Button>
        <Button variant="outline" onClick={() => setDrawer(true)}>打开抽屉</Button>
        <Button variant="soft" onClick={() => message.success('操作成功')}>全局提示</Button>
        <Button variant="text" onClick={() => setVisible((v) => !v)}>切换过渡</Button>
      </Space>

      <Transition visible={visible} preset="slide-up">
        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--i-color-brand-subtle)', color: 'var(--i-color-brand-text)' }}>
          这个块由 &lt;Transition&gt; 驱动：进场 / 离场的相位与时序由 core 的状态机决定。
        </div>
      </Transition>

      <Dialog open={dialog} title="删除文件？" onClose={() => setDialog(false)} onConfirm={() => { setDialog(false); message.success('已删除'); }}>
        该操作不可撤销。焦点被锁在对话框内，Esc 可以关闭，背景滚动被锁定。
      </Dialog>
      <Drawer open={drawer} title="设置" onClose={() => setDrawer(false)}>
        抽屉复用了对话框的焦点锁与 Esc 行为，只是换了进场方向；RTL 下会自动从另一侧滑入。
      </Drawer>
    </>
  );
}

function CarouselDemo() {
  const slides = [
    { title: '拖拽切换', hint: '按住往左右拖，松手时按位移判定', bg: 'linear-gradient(135deg, #4169ef, #6b90fb)' },
    { title: '键盘可达', hint: '聚焦后用 ← → Home End', bg: 'linear-gradient(135deg, #12b76a, #6ce9a6)' },
    { title: '自动播放', hint: '悬停或聚焦时自动暂停', bg: 'linear-gradient(135deg, #dc6803, #fdb022)' },
  ];
  return (
    <div style={{ width: '100%' }}>
      <Carousel autoplay={3600} label="特性介绍">
        {slides.map((slide) => (
          <div key={slide.title} className="slide" style={{ background: slide.bg }}>
            {slide.title}
            <small>{slide.hint}</small>
          </div>
        ))}
      </Carousel>
    </div>
  );
}

function NavDemo() {
  const [page, setPage] = useState(6);
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Breadcrumb items={[{ label: '首页', href: '#' }, { label: '组件', href: '#' }, { label: '导航' }]} />
      <Steps current={1} items={[{ title: '填写信息' }, { title: '确认订单' }, { title: '完成' }]} />
      <Collapse accordion defaultValue={['q1']} items={[{ value: 'q1', header: '如何换肤？' }, { value: 'q2', header: '如何按需引入？' }]}>
        {(item) => (item.value === 'q1'
          ? '给 ConfigProvider 传 tokens 即可，运行时下发 CSS 变量，无需重新构建。'
          : '样式与逻辑分包，后续提供 unplugin 自动引入。')}
      </Collapse>
      <Pagination current={page} total={200} onChange={setPage} />
    </div>
  );
}

export const navEntries: DocEntry[] = [
  {
    id: 'tabs',
    name: 'Tabs',
    cn: '标签页',
    category: '导航',
    description: '三种视觉变体。tab 与 panel 之间的 aria-controls / aria-labelledby 配对由 core 生成，方向键切换来自共享的 roving 引擎。',
    whenToUse: [
      '同一层级的内容分组切换，且内容之间相互独立。',
      '内容有先后顺序或依赖关系时用 Steps，不要用 Tabs。',
      '工具栏里的二选一 / 三选一开关可以用 variant="segment"，此时不渲染面板。',
    ],
    demos: [
      {
        caption: 'segment / line / card',
        render: () => <TabsDemo />,
        react: `<Tabs variant="segment" value={tab} onChange={setTab}
  items={[{ value: 'a', label: '概览' }, { value: 'b', label: '详情' }]}>
  {(item) => <div>面板内容：{item.label}</div>}
</Tabs>`,
        vue: `<ITabs v-model="tab" variant="segment"
  :items="[{ value: 'a', label: '概览' }, { value: 'b', label: '详情' }]">
  <template #default="item">面板内容：{{ item.label }}</template>
</ITabs>`,
      },
    ],
    props: [
      { name: 'items', type: 'Array<{ value, label?, disabled? }>', desc: '标签项' },
      { name: 'variant', type: `'line' | 'card' | 'segment'`, default: `'line'`, desc: '视觉变体' },
      { name: 'orientation', type: `'horizontal' | 'vertical'`, default: `'horizontal'`, desc: '排列与方向键轴向' },
    ],
  },
  {
    id: 'nav',
    name: 'Breadcrumb / Steps / Collapse / Pagination',
    cn: '导航组件',
    category: '导航',
    description: 'Pagination 的省略号区间在 core 里用一个纯函数算出来，越界页码会被夹紧；Collapse 的展开面板用 grid 行高过渡，不需要测量 scrollHeight。',
    demos: [
      {
        caption: '组合示例',
        render: () => <NavDemo />,
        react: `<Breadcrumb items={[{ label: '首页', href: '/' }, { label: '详情' }]} />
<Steps current={1} items={[{ title: '填写信息' }, { title: '确认订单' }]} />
<Collapse accordion defaultValue={['q1']} items={items}>
  {(item) => panels[item.value]}
</Collapse>
<Pagination current={page} total={200} onChange={setPage} />`,
        vue: `<IBreadcrumb :items="[{ label: '首页', href: '/' }, { label: '详情' }]" />
<ISteps :current="1" :items="[{ title: '填写信息' }, { title: '确认订单' }]" />
<ICollapse v-model="open" accordion :items="items">
  <template #q1>面板内容</template>
</ICollapse>
<IPagination v-model="page" :total="200" />`,
      },
    ],
    props: [
      { name: 'items', type: 'Array', desc: 'Breadcrumb / Steps / Collapse 的数据项' },
      { name: 'current', type: 'number', desc: 'Steps 当前步骤 / Pagination 当前页' },
      { name: 'total / pageSize', type: 'number', default: '— / 10', desc: 'Pagination 总条数与每页条数' },
      { name: 'siblings', type: 'number', default: '1', desc: 'Pagination 当前页左右保留的页码数' },
      { name: 'accordion', type: 'boolean', default: 'false', desc: 'Collapse 手风琴模式' },
    ],
  },
  {
    id: 'overlay',
    name: 'Dialog / Drawer / Transition',
    cn: '浮层与动效',
    category: '导航',
    description: 'Dialog 与 Drawer 共享同一套行为：焦点锁、引用计数的滚动锁、Esc 关闭、遮罩点击。传送到 body 后会重新贴上主题属性，深色应用不会弹出亮色弹窗。Transition 由 core 的相位状态机驱动，两端时序一致。',
    whenToUse: [
      'Dialog 用于需要用户确认、且必须打断当前流程的操作。',
      'Drawer 用于不打断主流程的补充信息或设置，内容较长时优先于 Dialog。',
      '轻量结果反馈用 message，不要为"保存成功"弹一个 Dialog。',
    ],
    demos: [
      {
        caption: '浮层与过渡',
        render: () => <OverlayDemo />,
        react: `<Dialog open={open} title="删除文件？"
  onClose={() => setOpen(false)} onConfirm={remove}>
  该操作不可撤销。
</Dialog>

<Drawer open={drawer} placement="right" size="360px" onClose={close}>设置项</Drawer>

<Transition visible={visible} preset="slide-up">
  <Panel />
</Transition>

message.success('操作成功');`,
        vue: `<IDialog v-model="open" title="删除文件？" @confirm="remove">
  该操作不可撤销。
</IDialog>

<IDrawer v-model="drawer" placement="right" size="360px">设置项</IDrawer>

<ITransition :visible="visible" preset="slide-up">
  <Panel />
</ITransition>

message.success('操作成功');`,
      },
    ],
    props: [
      { name: 'open / v-model', type: 'boolean', desc: '显示状态' },
      { name: 'size', type: `Dialog: 's'|'m'|'l'|'full'；Drawer: CSS 长度`, default: `'m' / '320px'`, desc: '尺寸' },
      { name: 'placement', type: `'left' | 'right' | 'top' | 'bottom'`, default: `'right'`, desc: 'Drawer 进场方向，RTL 自动镜像' },
      { name: 'closeOnMask / closeOnEscape', type: 'boolean', default: 'true', desc: '关闭方式开关' },
      { name: 'preset', type: `'fade' | 'scale' | 'slide-up' | 'slide-down' | 'slide-start' | 'slide-end' | 'collapse'`, default: `'fade'`, desc: 'Transition 动效预设' },
    ],
  },
  {
    id: 'carousel',
    name: 'Carousel',
    cn: '轮播图',
    category: '导航',
    description: '指针拖拽、键盘方向键、自动播放（悬停与聚焦时暂停）。轨道只用 transform 位移，保持在合成层上；非当前页的幻灯片会被标记 aria-hidden 与 inert，不会进入 Tab 顺序。',
    whenToUse: [
      '同一位置轮流展示多张等价内容，如首页banner、图集。',
      '关键信息不要只放在非首屏的幻灯片里——用户不一定会等到它出现。',
      '开启 autoplay 时必须允许暂停，组件已在悬停与聚焦时自动暂停。',
    ],
    demos: [
      {
        caption: '拖拽 / 键盘 / 自动播放',
        render: () => <CarouselDemo />,
        react: `<Carousel autoplay={3600} label="特性介绍">
  {slides.map((slide) => (
    <div key={slide.title} className="slide">{slide.title}</div>
  ))}
</Carousel>`,
        vue: `<ICarousel :autoplay="3600" label="特性介绍">
  <div v-for="slide in slides" :key="slide.title" class="slide">
    {{ slide.title }}
  </div>
</ICarousel>`,
      },
    ],
    props: [
      { name: 'index / v-model', type: 'number', desc: '受控页码；不传则组件自持' },
      { name: 'autoplay', type: 'number', default: '0', desc: '毫秒间隔，0 关闭；悬停/聚焦自动暂停' },
      { name: 'loop', type: 'boolean', default: 'true', desc: '首尾循环' },
      { name: 'orientation', type: `'horizontal' | 'vertical'`, default: `'horizontal'`, desc: '滑动轴向' },
      { name: 'dragThreshold', type: 'number', default: '40', desc: '判定为翻页的最小拖拽距离（px）' },
      { name: 'showArrows / showDots', type: 'boolean', default: 'true', desc: '箭头与指示点' },
    ],
  },
];
