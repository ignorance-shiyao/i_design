import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Alert, Avatar, Badge, Button, Card, Divider, Icon, Input, Pagination,
  Select, Skeleton, Switch, Table, Tabs, Tag
} from '../src'
import '@i-design/common/styles/index.css'

/** 与 Vue 端相同的用例，用于逐像素比对两端渲染结果 */
function App() {
  const [text, setText] = useState('')
  const [on, setOn] = useState(true)
  const [page, setPage] = useState(12)
  const [tab, setTab] = useState('overview')
  const [selected, setSelected] = useState<string | number | null>('requirement')

  const rows = [
    { id: 'WI-1024', title: '登录页支持短信验证码', owner: '林岚', points: 5 },
    { id: 'WI-1031', title: '工作项列表虚拟滚动', owner: '陈序', points: 8 },
    { id: 'WI-1042', title: '深色模式对比度校准', owner: '苏禾', points: 3 }
  ]

  return (
    <div style={{ padding: 32, display: 'grid', gap: 24, maxWidth: 640 }}>
      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button variant="primary">主按钮</Button>
        <Button>次按钮</Button>
        <Button variant="text">文字按钮</Button>
        <Button variant="danger">删除</Button>
        <Button variant="primary" loading>提交中</Button>
        <Button disabled>禁用</Button>
      </section>

      <section style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button size="sm">小</Button>
        <Button size="md">中</Button>
        <Button size="lg">大</Button>
      </section>

      <section style={{ display: 'flex', gap: 8 }}>
        <Tag>默认</Tag>
        <Tag type="brand">品牌</Tag>
        <Tag type="success">成功</Tag>
        <Tag type="warning">警告</Tag>
        <Tag type="danger">危险</Tag>
        <Tag type="brand" round>进行中</Tag>
      </section>

      <section style={{ display: 'grid', gap: 12, maxWidth: 260 }}>
        <Input value={text} onChange={setText} placeholder="请输入工作项标题" />
        <Input value="非法输入" invalid onChange={() => {}} />
        <Input placeholder="已禁用" disabled />
      </section>

      <section style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Switch checked={on} onChange={setOn} />
        <Switch checked={false} onChange={() => {}} />
        <Avatar name="林岚" />
        <Avatar name="陈序" />
        <Avatar name="Susan Wong" />
        <Avatar />
        <Avatar name="苏禾" shape="square" size="lg" />
        <Icon name="sparkle" size={20} />
        <Icon name="refresh" size={20} spin />
      </section>

      <section style={{ display: 'grid', gap: 12, maxWidth: 260 }}>
        <Select
          value={selected}
          onChange={setSelected}
          options={[
            { label: '需求', value: 'requirement' },
            { label: '缺陷', value: 'bug' },
            { label: '任务', value: 'task' },
            { label: '风险（暂不可选）', value: 'risk', disabled: true }
          ]}
          clearable
        />
      </section>

      <section>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { name: 'overview', label: '概览' },
            { name: 'members', label: '成员' },
            { name: 'audit', label: '审计日志', disabled: true }
          ]}
        >
          {tab === 'overview' ? '本迭代共 24 个工作项，已完成 18 个。' : '当前项目共 8 名成员。'}
        </Tabs>
      </section>

      <section>
        <Table
          rowKey="id"
          data={rows}
          columns={[
            { key: 'id', title: '编号', width: '110px' },
            { key: 'title', title: '标题', sortable: true },
            { key: 'owner', title: '负责人', width: '100px' },
            {
              key: 'points',
              title: '故事点',
              width: '90px',
              align: 'right',
              sortable: true,
              render: (v) => <Tag type="brand">{v}</Tag>
            }
          ]}
        />
      </section>

      <section>
        <Pagination current={page} total={1000} pageSize={10} onChange={setPage} />
      </section>

      <section style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <Badge count={5}><Button>消息</Button></Badge>
        <Badge count={128}><Button>通知</Button></Badge>
        <Badge dot type="brand"><Avatar name="林岚" /></Badge>
        <Badge count={7} type="success" />
      </section>

      <Divider>卡片与骨架屏</Divider>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="迭代概览" hoverable>本迭代共 24 个工作项，已完成 18 个。</Card>
        <Card title="加载中"><Skeleton variant="paragraph" rows={3} /></Card>
      </section>

      <section style={{ display: 'grid', gap: 12 }}>
        <Alert type="info">系统将于今晚 22:00 维护。</Alert>
        <Alert type="success" title="提交成功">工作项已同步到看板。</Alert>
        <Alert type="danger" title="构建失败" closable>请查看流水线日志。</Alert>
      </section>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
