// 仅由 Vite 开发服务器提供的测量夹具，不进入站点构建或公共组件 API。
import { createApp, h, nextTick } from 'vue'
import IFlow from '../../src/components/IFlow.vue'
import IChatList from '../../src/components/IChatList.vue'
import '../../src/styles/global.css'

const kind = new URLSearchParams(location.search).get('kind')
const count = kind === 'flow' ? 100 : 1000
const nodes = Array.from({ length: count }, (_, i) => ({
  id: `n${i}`, label: `节点 ${i}`, x: (i % 10) * 180, y: Math.floor(i / 10) * 90
}))
const edges = nodes.slice(1).map((n, i) => ({ from: nodes[i].id, to: n.id }))
const sessions = Array.from({ length: count }, (_, i) => ({
  id: `s${i}`, title: `固定长度会话 ${i}`, updatedAt: 1789776000000 - i * 86400000
}))
createApp({ render: () => kind === 'flow'
  ? h(IFlow, { nodes, edges })
  : h(IChatList, { sessions })
}).mount('#workload')
await nextTick()
await new Promise(requestAnimationFrame)
document.body.dataset.ready = 'true'
