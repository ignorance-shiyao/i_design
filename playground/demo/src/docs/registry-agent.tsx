import { useState } from 'react';
import { ApprovalCard, ContextCard, TaskList, ToolChip, Button, type AgentTask, type ApprovalStatus } from '@i-design/react';
import type { DocEntry } from './types.js';
const INITIAL: AgentTask[] = [
    { id: 'read', title: '读取设计令牌', description: '已检查色彩、圆角和间距定义', status: 'complete' },
    { id: 'compare', title: '对比组件接口', description: '类型检查失败，等待重新执行', status: 'error' },
    { id: 'report', title: '生成变更摘要', description: '等待接口检查通过', status: 'pending' },
];
function ApprovalDemo() {
    const [status, setStatus] = useState<ApprovalStatus>('pending');
    return <div style={{ width: '100%', maxWidth: 560, display: 'grid', gap: 16 }}>
    <ApprovalCard title="将本次修改加入变更清单？" description="包含 4 个新增组件及双端使用文档。确认后仅更新本地示例状态。" status={status} onApprove={() => setStatus('approved')} onReject={() => setStatus('rejected')}>
      涉及范围：组件接口、共享样式、文档示例
    </ApprovalCard>
    <Button size="s" onClick={() => setStatus('pending')} disabled={status === 'pending'}>重新演示</Button>
  </div>;
}
function TasksDemo() {
    const [items, setItems] = useState(INITIAL);
    const active = items.some(item => item.status === 'running');
    return <div style={{ width: '100%', maxWidth: 660, display: 'grid', gap: 16 }}>
    <TaskList items={items} onRetry={id => setItems(items.map(item => item.id === id ? { ...item, status: 'running', description: '正在重新检查接口（本地模拟）' } : item))}/>
    <div style={{ display: 'flex', gap: 8 }}><Button size="s" disabled={!active} onClick={() => setItems(items.map(item => ({ ...item, status: 'complete', description: '本地模拟已完成' })))}>模拟完成</Button><Button size="s" onClick={() => setItems(INITIAL)}>重置</Button></div>
  </div>;
}
export const agentEntries: DocEntry[] = [
    { id: 'approval-card', name: 'ApprovalCard', cn: '操作确认', category: 'AI 会话',
        description: '将 AI 提议、影响范围与人工决策放在同一张卡片里。使用受控状态，便于业务侧接入异步审批与审计。',
        whenToUse: ['智能体需要人工确认后继续执行的操作。', 'busy 期间阻止重复点击；请求失败时由宿主清除 busy、显示错误，保留 pending 以便重试。'],
        demos: [{ caption: '确认、拒绝与结果回显', hint: '本地交互演示，不会修改文件或调用外部服务。', render: () => <ApprovalDemo />,
                react: `import { useState } from 'react';\nimport { ApprovalCard, type ApprovalStatus } from '@i-design/react';\n\nfunction Demo() {\n  const [status, setStatus] = useState<ApprovalStatus>('pending');\n  return <ApprovalCard title="加入变更清单？" status={status}\n    onApprove={() => setStatus('approved')}\n    onReject={() => setStatus('rejected')} />;\n}`,
                vue: `<script setup lang="ts">\nimport { ref } from 'vue';\nimport { ApprovalCard, type ApprovalStatus } from '@i-design/vue';\nconst status = ref<ApprovalStatus>('pending');\n</script>\n<template>\n  <ApprovalCard title="加入变更清单？" :status="status"\n    @approve="status = 'approved'" @reject="status = 'rejected'" />\n</template>` }],
        props: [{ name: 'title / description', type: 'string', desc: '操作标题（必填）与影响说明' }, { name: 'status', type: "'pending' | 'approved' | 'rejected'", default: "'pending'", desc: '宿主控制；完成后禁用按钮' }, { name: 'busy', type: 'boolean', default: 'false', desc: '请求中禁用确认和拒绝' }, { name: 'onApprove / @approve, onReject / @reject', type: '() => void', desc: '仅发送决策意图，不执行外部操作' }, { name: 'labels', type: 'Partial<AgentLabels>', desc: '覆盖状态和按钮文案，用于本地化' }, { name: 'children / default slot', type: 'ReactNode / Slot', desc: '影响范围等补充内容' }] },
    { id: 'task-list', name: 'TaskList', cn: '执行计划', category: 'AI 会话', description: '用紧凑行展示执行顺序、状态与失败原因，失败任务可单独重试。',
        demos: [{ caption: '失败重试与进度更新', hint: '先点击重试，再点击模拟完成。所有状态由示例数据控制。', render: () => <TasksDemo />,
                react: `import { useState } from 'react';\nimport { TaskList, type AgentTask } from '@i-design/react';\nfunction Demo() {\n  const [items, setItems] = useState<AgentTask[]>([\n    { id: 'check', title: '检查接口', status: 'error' },\n  ]);\n  return <TaskList items={items} onRetry={id =>\n    setItems(prev => prev.map(item => item.id === id\n      ? { ...item, status: 'running' } : item))} />;\n}`,
                vue: `<script setup lang="ts">\nimport { ref } from 'vue';\nimport { TaskList, type AgentTask } from '@i-design/vue';\nconst items = ref<AgentTask[]>([\n  { id: 'check', title: '检查接口', status: 'error' },\n]);\nfunction retry(id: string) {\n  items.value = items.value.map(item => item.id === id\n    ? { ...item, status: 'running' } : item);\n}\n</script>\n<template><TaskList :items="items" @retry="retry" /></template>` }],
        props: [{ name: 'items', type: 'AgentTask[]', desc: '必填；每项包含唯一 id、title、status，可选 description' }, { name: 'status（每项）', type: "'pending' | 'running' | 'complete' | 'error'", desc: '由业务侧事件更新' }, { name: 'title', type: 'string', default: '执行计划', desc: '列表标题' }, { name: 'onRetry / @retry', type: '(id: string) => void', desc: '传入后，仅失败项显示重试按钮' }, { name: 'labels', type: 'Partial<AgentLabels>', desc: '状态与重试文案' }] },
    { id: 'tool-chip', name: 'ToolChip', cn: '工具调用', category: 'AI 会话', description: '将工具名、执行状态和结果详情压缩为可展开标签，保留消息流的阅读节奏。',
        demos: [{ caption: '四种状态与可展开结果', hint: '有详情的标签支持点击、Enter 或空格展开；无详情时为静态标签。', render: () => <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 520 }}>
      <ToolChip label="read_tokens" status="complete" detail={'读取完成\n包含颜色、圆角、间距与字体定义。'}/>
      <ToolChip label="compare_interfaces" status="running" detail="正在比对 React / Vue 的公共接口。"/>
      <ToolChip label="build_preview" status="error" detail="构建失败：请检查接口类型后重试。"/>
      <ToolChip label="write_summary" status="pending"/></div>,
                react: `import { ToolChip } from '@i-design/react';\n<ToolChip label="read_tokens" status="complete" detail="读取完成：颜色、圆角与间距。" />`,
                vue: `<script setup>\nimport { ToolChip } from '@i-design/vue';\n</script>\n<template><ToolChip label="read_tokens" status="complete" detail="读取完成：颜色、圆角与间距。" /></template>` }],
        props: [{ name: 'label', type: 'string', desc: '工具名称，必填' }, { name: 'status', type: 'AgentStatus', default: 'pending', desc: '执行状态' }, { name: 'detail', type: 'string', desc: '传入后使用原生 details / summary 展开；按纯文本渲染' }, { name: 'labels', type: 'Partial<AgentLabels>', desc: '覆盖状态文案' }] },
    { id: 'context-card', name: 'ContextCard', cn: '上下文引用', category: 'AI 会话', description: '把检索摘要与来源一起呈现，让用户检查回答依据。使用普通链接，支持键盘访问。',
        demos: [{ caption: '摘要与可访问来源', render: () => <div style={{ width: '100%', maxWidth: 560 }}><ContextCard title="交互参考：AI 界面组件" excerpt="参考工具调用、任务状态与人工确认的呈现方式，沿用 i-design 的设计令牌与双框架接口。" source="Beautiful UI" href="https://www.beautifului.dev/" meta="设计参考 · 网站"/></div>,
                react: `import { ContextCard } from '@i-design/react';\n<ContextCard title="交互参考" excerpt="工具调用、任务状态与人工确认。"\n  source="Beautiful UI" href="https://www.beautifului.dev/" />`,
                vue: `<script setup>\nimport { ContextCard } from '@i-design/vue';\n</script>\n<template><ContextCard title="交互参考" excerpt="工具调用、任务状态与人工确认。"\n  source="Beautiful UI" href="https://www.beautifului.dev/" /></template>` }],
        props: [{ name: 'title / excerpt / source', type: 'string', desc: '必填；标题、纯文本摘要、来源名称' }, { name: 'href', type: 'string', desc: '支持 http(s)、/、./、../、# 链接；其他协议降级为文字' }, { name: 'meta', type: 'string', default: '参考来源', desc: '来源类型或附加说明' }] },
];
