import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Alert, Avatar, Button, Icon, Input, Switch, Tag } from '../src'
import '@i-design/common/styles/index.css'

/** 与 Vue 端相同的用例，用于逐像素比对两端渲染结果 */
function App() {
  const [text, setText] = useState('')
  const [on, setOn] = useState(true)

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
