import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Alert, Avatar, AvatarGroup, Badge, Breadcrumb, Button, Card, Checkbox, CheckboxGroup,
  Collapse, DatePicker, Descriptions, Divider, Drawer, Empty, Form, FormItem, Icon, Input,
  Loading, message, Modal, Pagination, Popconfirm, Radio, RadioGroup, Result, Select,
  Skeleton, Steps, Switch, Table, Tabs, Tag, Textarea, Tooltip, Upload
} from '../src'
import type { UploadFile } from '@i-design/common'
import '@i-design/common/styles/index.css'

/** 覆盖全部导出组件的验证页：文件存在不等于能用，每个都要真渲染一次 */
function App() {
  const [text, setText] = useState('')
  const [area, setArea] = useState('复现步骤：1. 打开工作项列表')
  const [on, setOn] = useState(true)
  const [page, setPage] = useState(12)
  const [tab, setTab] = useState('overview')
  const [sel, setSel] = useState<string | number | null>('requirement')
  const [date, setDate] = useState<string | null>('2026-09-07')
  const [radio, setRadio] = useState<string | number | boolean>('week')
  const [checks, setChecks] = useState<(string | number)[]>(['bug'])
  const [single, setSingle] = useState(true)
  const [collapse, setCollapse] = useState<string[]>(['what'])
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [loading, setLoading] = useState(true)
  const [form] = useState(() => ({ title: '', owner: '' }))
  const [formState, setFormState] = useState(form)

  const rows = [
    { id: 'WI-1024', title: '登录页支持短信验证码', owner: '林岚', points: 5 },
    { id: 'WI-1031', title: '工作项列表虚拟滚动', owner: '陈序', points: 8 },
    { id: 'WI-1042', title: '深色模式对比度校准', owner: '苏禾', points: 3 }
  ]

  const S = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <section data-probe={id} style={{ display: 'grid', gap: 12 }}>
      <h3 style={{ fontSize: 13, color: 'var(--i-color-text-tertiary)', fontFamily: 'monospace' }}>{title}</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
    </section>
  )

  return (
    <div style={{ padding: 32, display: 'grid', gap: 28, maxWidth: 760 }}>
      <S id="button" title="Button / Tag / Icon / Badge">
        <Button variant="primary">主按钮</Button>
        <Button>次按钮</Button>
        <Button variant="danger">删除</Button>
        <Button variant="primary" loading>提交中</Button>
        <Tag type="brand">需求</Tag>
        <Icon name="sparkle" size={20} />
        <Badge count={5}><Button>消息</Button></Badge>
        <Badge dot type="brand"><Avatar name="林岚" /></Badge>
      </S>

      <S id="avatar" title="Avatar / AvatarGroup">
        <Avatar name="林岚" />
        <Avatar name="Susan Wong" />
        <Avatar src="/broken.png" name="周迟" />
        <AvatarGroup max={3} total={8}>
          <Avatar name="林岚" /><Avatar name="陈序" /><Avatar name="苏禾" />
        </AvatarGroup>
      </S>

      <S id="input" title="Input / Textarea / Select / DatePicker">
        <div style={{ width: 220 }}><Input value={text} onChange={setText} placeholder="标题" /></div>
        <div style={{ width: 220 }}>
          <Select value={sel} onChange={setSel} clearable options={[
            { label: '需求', value: 'requirement' },
            { label: '缺陷', value: 'bug' },
            { label: '风险（禁用）', value: 'risk', disabled: true }
          ]} />
        </div>
        <div style={{ width: 220 }}><DatePicker value={date} onChange={setDate} clearable /></div>
        <div style={{ width: 320 }}><Textarea value={area} onChange={setArea} maxLength={120} showCount rows={3} /></div>
      </S>

      <S id="choice" title="Radio / Checkbox / Switch">
        <RadioGroup value={radio} onChange={setRadio} variant="button">
          <Radio value="day">今日</Radio><Radio value="week">本周</Radio><Radio value="month" disabled>本月</Radio>
        </RadioGroup>
        <CheckboxGroup value={checks} onChange={setChecks} max={2}>
          <Checkbox value="bug">缺陷</Checkbox><Checkbox value="req">需求</Checkbox><Checkbox value="task">任务</Checkbox>
        </CheckboxGroup>
        <Checkbox checked={single} onChange={setSingle}>单独使用</Checkbox>
        <Switch checked={on} onChange={setOn} />
      </S>

      <S id="nav" title="Breadcrumb / Steps / Tabs / Pagination">
        <Breadcrumb items={[{ label: '首页', to: '#' }, { label: '组件', to: '#' }, { label: '当前' }]} />
      </S>
      <div data-probe="steps"><Steps current={1} items={[{ title: '基本信息' }, { title: '关联迭代' }, { title: '确认' }]} /></div>
      <div data-probe="tabs">
        <Tabs value={tab} onChange={setTab} items={[
          { name: 'overview', label: '概览' }, { name: 'members', label: '成员' }, { name: 'audit', label: '审计', disabled: true }
        ]}>{tab === 'overview' ? '概览内容' : '成员内容'}</Tabs>
      </div>
      <div data-probe="pagination"><Pagination current={page} total={1000} onChange={setPage} /></div>

      <div data-probe="table">
        <Table rowKey="id" data={rows} columns={[
          { key: 'id', title: '编号', width: '110px' },
          { key: 'title', title: '标题', sortable: true },
          { key: 'points', title: '故事点', width: '90px', align: 'right', sortable: true, render: (v) => <Tag type="brand">{v}</Tag> }
        ]} />
      </div>

      <div data-probe="descriptions">
        <Descriptions title="工作项详情" column={2} items={[
          { label: '编号', value: 'WI-1024' }, { label: '负责人', value: '林岚' },
          { label: '预计完成', value: '' }, { label: '描述', value: '支持短信验证码', span: 2 }
        ]} />
      </div>

      <div data-probe="collapse">
        <Collapse value={collapse} onChange={setCollapse} items={[
          { name: 'what', title: '什么是设计令牌？', content: '设计与代码之间唯一的契约。' },
          { name: 'why', title: '为什么不写死色值？', content: '换肤只需覆盖语义层。' }
        ]} />
      </div>

      <S id="overlay" title="Modal / Drawer / Popconfirm / Tooltip / message">
        <Button onClick={() => setModal(true)}>打开对话框</Button>
        <Button onClick={() => setDrawer(true)}>打开抽屉</Button>
        <Popconfirm title="确认归档？" onConfirm={() => message.success('已归档')}>
          <Button>归档</Button>
        </Popconfirm>
        <Tooltip content="补充说明"><Button>悬浮提示</Button></Tooltip>
        <Button onClick={() => message.info('这是一条全局提示')}>全局提示</Button>
      </S>

      <S id="feedback" title="Alert / Loading / Skeleton / Empty / Result">
        <div style={{ width: '100%' }}><Alert type="success" title="提交成功">已同步到看板。</Alert></div>
        <Loading size="md" text="加载中" />
        <Button size="sm" onClick={() => setLoading(!loading)}>切换骨架</Button>
      </S>
      <div data-probe="skeleton" style={{ width: 320 }}>
        <Skeleton loading={loading} variant="avatar"><div>真实内容已加载</div></Skeleton>
      </div>
      <div data-probe="empty"><Empty type="search" size="sm" /></div>
      <div data-probe="result"><Result status="success" size="sm" title="操作成功"><Button variant="primary">继续</Button></Result></div>

      <Divider>卡片</Divider>
      <div data-probe="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="迭代概览" hoverable>本迭代共 24 个工作项，已完成 18 个。</Card>
        <Card title="加载中"><Skeleton variant="paragraph" rows={3} /></Card>
      </div>

      <div data-probe="upload" style={{ width: 420 }}>
        <Upload value={files} onChange={setFiles} accept=".png,.pdf" maxSize={5}
          onReject={(f, r) => message.warning(`${f.name}：${r}`)} />
      </div>

      <div data-probe="form" style={{ width: 420 }}>
        <Form model={formState} labelWidth="88px"
          rules={{
            title: [{ required: true, message: '请输入标题' }, { min: 4, message: '不少于 4 个字符' }],
            owner: [{ pattern: /^[A-Z]\d{5}$/, message: '格式如 A10086' }]
          }}
          onSubmit={() => message.success('校验通过')}
          onInvalid={(e) => message.error(`还有 ${Object.keys(e).length} 项未通过`)}
        >
          <FormItem prop="title" label="标题">
            {({ invalid }) => (
              <Input value={formState.title} invalid={invalid}
                onChange={(v) => setFormState((s) => ({ ...s, title: v }))} placeholder="请输入标题" />
            )}
          </FormItem>
          <FormItem prop="owner" label="工号" help="示例：A10086">
            {({ invalid }) => (
              <Input value={formState.owner} invalid={invalid}
                onChange={(v) => setFormState((s) => ({ ...s, owner: v }))} placeholder="请输入工号" />
            )}
          </FormItem>
          <FormItem>
            <Button variant="primary" htmlType="submit">提交</Button>
          </FormItem>
        </Form>
      </div>

      <Modal open={modal} title="迭代说明" onClose={() => setModal(false)}
        footer={<Button variant="primary" onClick={() => setModal(false)}>我知道了</Button>}>
        本迭代已冻结。
      </Modal>
      <Drawer open={drawer} title="工作项详情" onClose={() => setDrawer(false)}>
        WI-1024 登录页支持短信验证码。
      </Drawer>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
