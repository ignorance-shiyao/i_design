import { useState } from 'react';
import {
  Alert, Avatar, Badge, Button, Card, Checkbox, Col, Divider, Empty, Progress, Row,
  Skeleton, Space, Spinner, Switch, Tag, Tooltip, message,
} from '@i-design/react';
import type { DocEntry } from './types.js';

export const basicEntries: DocEntry[] = [
  {
    id: 'button',
    name: 'Button',
    cn: '按钮',
    category: '通用',
    description: '四种视觉层级（solid / outline / soft / text）× 五种语义状态 × 三种尺寸。loading 期间会吞掉点击事件，不需要业务代码再判一次。',
    whenToUse: [
      '需要用户在一处做出明确动作时——提交、确认、跳转。',
      '一屏内只应有一个 status="brand" 的主按钮；并列多个主按钮会让人不知道该点哪个。',
      '异步动作请用 loading 而不是自己禁用：loading 期间组件已经吞掉点击，语义也会通过 aria-busy 上报。',
    ],
    demos: [
      {
        caption: '层级与状态',
        render: () => (
          <>
            <Space wrap>
              <Button status="brand">主要操作</Button>
              <Button variant="outline">次要操作</Button>
              <Button variant="soft" status="success">柔和</Button>
              <Button variant="text" status="danger">危险文字</Button>
            </Space>
            <Space wrap>
              <Button size="s">小</Button>
              <Button size="m">中</Button>
              <Button size="l">大</Button>
              <Button status="brand" loading>提交中</Button>
              <Button disabled>禁用</Button>
            </Space>
          </>
        ),
        react: `import { Button, Space } from '@i-design/react';

<Space wrap>
  <Button status="brand" onClick={save}>主要操作</Button>
  <Button variant="outline">次要操作</Button>
  <Button variant="soft" status="success">柔和</Button>
  <Button variant="text" status="danger">危险文字</Button>
  <Button status="brand" loading>提交中</Button>
</Space>`,
        vue: `<script setup lang="ts">
import { IButton, ISpace } from '@i-design/vue';
</script>

<template>
  <ISpace wrap>
    <IButton status="brand" @click="save">主要操作</IButton>
    <IButton variant="outline">次要操作</IButton>
    <IButton variant="soft" status="success">柔和</IButton>
    <IButton variant="text" status="danger">危险文字</IButton>
    <IButton status="brand" loading>提交中</IButton>
  </ISpace>
</template>`,
      },
    ],
    props: [
      { name: 'variant', type: `'solid' | 'outline' | 'soft' | 'text'`, default: `'solid'`, desc: '视觉层级' },
      { name: 'status', type: `'default' | 'brand' | 'success' | 'warning' | 'danger'`, default: `'default'`, desc: '语义状态' },
      { name: 'size', type: `'s' | 'm' | 'l'`, default: `'m'`, desc: '尺寸；实际高度还受全局 density 影响' },
      { name: 'shape', type: `'rect' | 'round' | 'circle' | 'square'`, default: `'rect'`, desc: '形状' },
      { name: 'loading', type: 'boolean', default: 'false', desc: '加载态，期间点击不会触发回调' },
      { name: 'block', type: 'boolean', default: 'false', desc: '占满整行' },
      { name: 'href', type: 'string', desc: '传入后渲染为 <a>，禁用时自动去掉 href' },
    ],
  },
  {
    id: 'tag',
    name: 'Tag',
    cn: '标签',
    category: '通用',
    description: '用于状态标记和分类。soft 变体在深浅色下都做过对比度调整，不是简单的透明度叠加。',
    whenToUse: [
      '标记状态、分类或属性，本身不是可点击的操作入口。',
      '需要用户点击执行动作时用 Button，不要把 Tag 当按钮用。',
    ],
    demos: [
      {
        caption: '变体与状态',
        render: () => (
          <>
            <Space wrap>
              <Tag status="brand">品牌</Tag>
              <Tag status="success">已完成</Tag>
              <Tag status="warning">处理中</Tag>
              <Tag status="danger">失败</Tag>
              <Tag>默认</Tag>
            </Space>
            <Space wrap>
              <Tag variant="outline" status="brand">描边</Tag>
              <Tag variant="solid" status="brand">实心</Tag>
              <Tag round status="success">圆角</Tag>
              <Tag closable status="danger" onClose={() => message.info('已移除')}>可关闭</Tag>
            </Space>
          </>
        ),
        react: `<Tag status="success">已完成</Tag>
<Tag variant="outline" status="brand">描边</Tag>
<Tag closable onClose={remove}>可关闭</Tag>`,
        vue: `<ITag status="success">已完成</ITag>
<ITag variant="outline" status="brand">描边</ITag>
<ITag closable @close="remove">可关闭</ITag>`,
      },
    ],
    props: [
      { name: 'variant', type: `'soft' | 'outline' | 'solid'`, default: `'soft'`, desc: '视觉变体' },
      { name: 'status', type: 'Status', default: `'default'`, desc: '语义状态' },
      { name: 'closable', type: 'boolean', default: 'false', desc: '显示关闭按钮' },
      { name: 'round', type: 'boolean', default: 'false', desc: '全圆角' },
    ],
  },
  {
    id: 'layout',
    name: 'Space / Row / Col',
    cn: '布局',
    category: '通用',
    description: 'Space 处理一维间距；Row / Col 是 24 栅格，跨度通过 CSS 自定义属性下发，响应式断点纯 CSS 实现，没有 resize 监听。',
    demos: [
      {
        caption: '24 栅格与响应式',
        render: () => (
          <Row gutter={[12, 12]} style={{ width: '100%' }}>
            <Col span={24} md={8}><Card padding="m" bordered>span=24 md=8</Card></Col>
            <Col span={12} md={8}><Card padding="m" bordered>span=12 md=8</Card></Col>
            <Col span={12} md={8}><Card padding="m" bordered>span=12 md=8</Card></Col>
          </Row>
        ),
        react: `<Row gutter={[12, 12]}>
  <Col span={24} md={8}><Card>A</Card></Col>
  <Col span={12} md={8}><Card>B</Card></Col>
</Row>`,
        vue: `<IRow :gutter="[12, 12]">
  <ICol :span="24" :md="8"><ICard>A</ICard></ICol>
  <ICol :span="12" :md="8"><ICard>B</ICard></ICol>
</IRow>`,
      },
    ],
    props: [
      { name: 'gutter', type: 'number | [number, number]', default: '0', desc: 'Row：列间距 / [水平, 垂直]' },
      { name: 'span', type: 'number', default: '24', desc: 'Col：占据的栅格数（共 24）' },
      { name: 'sm / md / lg', type: 'number', desc: 'Col：≥640 / 960 / 1280px 时的跨度' },
      { name: 'gap', type: `'s' | 'm' | 'l'`, default: `'m'`, desc: 'Space：间距档位' },
    ],
  },
  {
    id: 'card',
    name: 'Card / Divider / Empty',
    cn: '容器',
    category: '通用',
    description: '容器类组件。Card 的 hover 抬升用 transform 而不是 margin，不会引起重排。',
    demos: [
      {
        caption: '卡片与空状态',
        render: () => (
          <Row gutter={[12, 12]} style={{ width: '100%' }}>
            <Col span={24} md={12}>
              <Card title="项目概览" extra={<Tag status="brand">进行中</Tag>} hoverable
                    footer={<Button size="s" variant="text">查看详情</Button>}>
                悬停时卡片会有 2px 的抬升与更深的投影。
              </Card>
            </Col>
            <Col span={24} md={12}>
              <Card title="空状态"><Empty description="还没有数据" /></Card>
            </Col>
          </Row>
        ),
        react: `<Card title="项目概览" extra={<Tag status="brand">进行中</Tag>} hoverable
      footer={<Button size="s" variant="text">查看详情</Button>}>
  内容
</Card>

<Empty description="还没有数据" />`,
        vue: `<ICard title="项目概览" hoverable>
  <template #extra><ITag status="brand">进行中</ITag></template>
  内容
  <template #footer><IButton size="s" variant="text">查看详情</IButton></template>
</ICard>

<IEmpty description="还没有数据" />`,
      },
    ],
    props: [
      { name: 'title', type: 'ReactNode | string', desc: '标题；Vue 也可用 #title 插槽' },
      { name: 'extra', type: 'ReactNode', desc: '标题右侧内容；Vue 用 #extra 插槽' },
      { name: 'hoverable', type: 'boolean', default: 'false', desc: '悬停抬升' },
      { name: 'padding', type: `'none' | 'm' | 'l'`, default: `'m'`, desc: '内边距档位' },
    ],
  },
  {
    id: 'feedback-basic',
    name: 'Alert / Progress / Skeleton / Spinner',
    cn: '状态反馈',
    category: '通用',
    description: '轻量状态展示。Alert 的 danger 变体会自动用 role="alert"，其余用 role="status"，避免非紧急信息打断屏幕阅读器。',
    demos: [
      {
        caption: '提示与进度',
        render: () => (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Alert status="success" title="部署成功" closable>构建产物已发布到生产环境。</Alert>
            <Alert status="danger" variant="outline">磁盘空间不足，无法继续写入。</Alert>
            <Progress value={68} />
            <Progress value={92} status="success" size="s" />
            <Space><Spinner /><Spinner size="s" /><Skeleton rows={2} /></Space>
          </div>
        ),
        react: `<Alert status="success" title="部署成功" closable>构建产物已发布。</Alert>
<Progress value={68} />
<Skeleton rows={2} loading={pending}>{content}</Skeleton>`,
        vue: `<IAlert status="success" title="部署成功" closable>构建产物已发布。</IAlert>
<IProgress :value="68" />
<ISkeleton :rows="2" :loading="pending">{{ content }}</ISkeleton>`,
      },
    ],
    props: [
      { name: 'status', type: `'info' | 'success' | 'warning' | 'danger'`, default: `'info'`, desc: 'Alert 语义' },
      { name: 'value / max', type: 'number', default: '— / 100', desc: 'Progress 进度值，越界会被夹紧' },
      { name: 'rows', type: 'number', default: '3', desc: 'Skeleton 骨架行数，最后一行较短' },
      { name: 'loading', type: 'boolean', default: 'true', desc: 'Skeleton：false 时直接渲染子内容' },
    ],
  },
  {
    id: 'avatar',
    name: 'Avatar / Badge / Tooltip',
    cn: '头像与提示',
    category: '通用',
    description: 'Avatar 无图时回退到首字缩写，中文取首字、拉丁文取首尾字母。Tooltip 的定位、翻转、边界收敛来自 core 的 computePosition。',
    demos: [
      {
        caption: '头像、徽标与气泡',
        render: () => (
          <Space gap="l">
            <Badge count={12}><Avatar name="Ada Lovelace" /></Badge>
            <Badge dot status="success"><Avatar name="张三" shape="square" /></Badge>
            <Avatar name="Alan Turing" size="l" />
            <Tooltip content="定位、翻转、边界收敛都来自同一个 computePosition">
              <Button variant="outline">悬停我</Button>
            </Tooltip>
            <Tooltip appearance="panel" trigger="click" placement="bottom"
                     content={<div style={{ maxWidth: 220 }}>点击触发的面板形态，可以放更复杂的内容。</div>}>
              <Button variant="outline">点击展开</Button>
            </Tooltip>
          </Space>
        ),
        react: `<Badge count={12}><Avatar name="Ada Lovelace" /></Badge>

<Tooltip content="说明文字" placement="top">
  <Button variant="outline">悬停我</Button>
</Tooltip>`,
        vue: `<IBadge :count="12"><IAvatar name="Ada Lovelace" /></IBadge>

<ITooltip content="说明文字" placement="top">
  <IButton variant="outline">悬停我</IButton>
</ITooltip>`,
      },
    ],
    props: [
      { name: 'name', type: 'string', desc: 'Avatar：无图时据此生成缩写' },
      { name: 'count / max', type: 'number', default: '— / 99', desc: 'Badge：超出显示 99+' },
      { name: 'dot', type: 'boolean', default: 'false', desc: 'Badge：小圆点形态' },
      { name: 'placement', type: 'Placement', default: `'top'`, desc: 'Tooltip：12 个方位，空间不足自动翻转' },
      { name: 'trigger', type: `'hover' | 'click' | 'focus' | 'manual'`, default: `'hover'`, desc: 'Tooltip 触发方式' },
    ],
  },
];

export const basicInteractive = { useState, Checkbox, Switch, Divider };
