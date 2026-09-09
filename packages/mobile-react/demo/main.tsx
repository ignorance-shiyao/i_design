import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ActionSheet, Button, Cell, Input, Switch, Tag, ToastHost, toast } from '../src'
import '@i-design/common/styles/index.css'
// 顺序要紧：移动覆盖层必须后于基础样式
import '@i-design/common/styles/mobile.css'

function App() {
  const [sheet, setSheet] = useState(false)
  const [on, setOn] = useState(true)
  const [text, setText] = useState('')

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ padding: 16, display: 'grid', gap: 12 }}>
        <Button variant="primary" block onClick={() => toast.success('已保存')}>
          保存
        </Button>
        <Button block onClick={() => setSheet(true)}>更多操作</Button>
        <Button block onClick={() => toast.loading('上传中')}>加载中 Toast</Button>
        <Input value={text} onChange={setText} placeholder="请输入工作项标题" />
        <div style={{ display: 'flex', gap: 8 }}>
          <Tag type="brand">需求</Tag>
          <Tag type="success">已评审</Tag>
        </div>
      </div>

      <div>
        <Cell title="负责人" value="林岚" onClick={() => toast.show('进入选择页')} />
        <Cell title="迭代" description="2026 S9 · 第 3 迭代" value="进行中" onClick={() => {}} />
        <Cell title="自动分配" value={<Switch checked={on} onChange={setOn} />} />
        <Cell title="故事点" value="5" />
      </div>

      <ActionSheet
        open={sheet}
        title="选择要执行的操作"
        onClose={() => setSheet(false)}
        actions={[
          { label: '编辑', onSelect: () => toast.show('编辑') },
          { label: '复制链接', onSelect: () => toast.success('已复制') },
          { label: '删除', danger: true, onSelect: () => toast.error('已删除') },
          { label: '归档（不可用）', disabled: true }
        ]}
      />
      <ToastHost />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
