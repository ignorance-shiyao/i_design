<script setup lang="ts">
import { ref } from 'vue'
import IFlow from '@/components/IFlow.vue'
import IButton from '@/components/IButton.vue'
import ISpace from '@/components/ISpace.vue'
import ISegmented from '@/components/ISegmented.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { autoLayout, type FlowEdge, type FlowNode } from '@i-design/common'

const edges: FlowEdge[] = [
  { from: 'start', to: 'fill' },
  { from: 'fill', to: 'review' },
  { from: 'review', to: 'approve', label: '通过' },
  { from: 'review', to: 'reject', label: '驳回' },
  { from: 'reject', to: 'fill' },
  { from: 'approve', to: 'done' }
]

const initial: Omit<FlowNode, 'x' | 'y'>[] = [
  { id: 'start', label: '发起申请', type: 'start' },
  { id: 'fill', label: '填写材料' },
  { id: 'review', label: '主管审批', type: 'decision' },
  { id: 'approve', label: '财务复核' },
  { id: 'reject', label: '退回修改' },
  { id: 'done', label: '归档', type: 'end' }
]

const nodes = ref<FlowNode[]>(autoLayout(initial, edges, { gapY: 92, gapX: 190 }))
const selected = ref<string | null>(null)

function onMove({ id, x, y }: { id: string; x: number; y: number }) {
  nodes.value = nodes.value.map((n) => (n.id === id ? { ...n, x, y } : n))
}

function relayout() {
  nodes.value = autoLayout(initial, edges, { gapY: 92, gapX: 190 })
}

const readonly = ref(false)

const edgeType = ref<'polyline' | 'straight' | 'bezier'>('polyline')
const edgeTypes = [
  { label: '折线', value: 'polyline' },
  { label: '直连', value: 'straight' },
  { label: '曲线', value: 'bezier' }
]
</script>

<template>
  <article>
    <h1>流程图</h1>
    <p class="i-lead">
      审批链、状态机、数据流向——这些东西写成文字要读三遍，画成图一眼就懂。
      画布负责摆放与交互，节点形状承担语义：开始与结束是胶囊，判断是菱形，其余是矩形。
      形状比颜色可靠——打印成黑白或读者有色觉障碍时，颜色会失效，形状不会。
    </p>

    <DemoBlock
      title="可拖拽的流程画布"
      description="拖动节点调整位置（自动吸附到网格），拖动空白处平移，右下角缩放或适应画布。点中节点会加重与它相连的线。"
    >
      <div class="flow-demo">
        <ISpace>
          <IButton size="sm" @click="relayout">重新布局</IButton>
          <IButton size="sm" :variant="readonly ? 'primary' : 'secondary'" @click="readonly = !readonly">
            {{ readonly ? '只读中' : '可编辑' }}
          </IButton>
          <ISegmented v-model="edgeType" :options="edgeTypes" />
          <span class="hint">{{ selected ? `已选中：${nodes.find((n) => n.id === selected)?.label}` : '未选中节点' }}</span>
        </ISpace>
        <IFlow
          v-model:selected="selected"
          :nodes="nodes"
          :edges="edges"
          :edge-type="edgeType"
          :readonly="readonly"
          @move="onMove"
        />
      </div>
    </DemoBlock>

    <h2>自动布局</h2>
    <p>
      只给节点与连线，不必手填坐标：按从入口出发的最长路径排层，同层横向居中铺开。
      回边会被跳过——审批流里「驳回 → 重新填写」是一条回边，顺着它继续推深度，
      整张图会一层层往下漂，层数变得和节点数一样多。手工调整过的节点保留坐标，
      自动布局只填未定位的那些。
    </p>

    <h2>连线</h2>
    <p>
      用直角折线而不是直连斜线：斜线穿过其他节点时很难辨认走向，直角折线的每一段
      都平行于画布，视线可以顺着走。端点吸附到节点边缘中点而不是中心，否则箭头会
      钻进节点里被填充盖住。连线标签底下垫一块底色，不垫的话线会从字中间穿过去。
    </p>

    <h2>属性</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td><code>nodes</code></td><td>节点数组：id、坐标、标签与形状语义</td></tr>
        <tr><td><code>edges</code></td><td>连线数组：from、to、可选标签与可选走向</td></tr>
        <tr>
          <td><code>edge-type</code></td>
          <td>
            整图默认连线走向：<code>polyline</code> 折线（默认，每段平行于画布，最适合审批流）、
            <code>straight</code> 直连、<code>bezier</code> 曲线（同一对节点间有多条线时更好读）。
            单条连线可用 <code>edge.type</code> 覆盖。
          </td>
        </tr>
        <tr><td><code>selected</code></td><td>当前选中节点，支持 v-model</td></tr>
        <tr><td><code>readonly</code></td><td>只读：仍可平移缩放与选中，但不能拖动节点</td></tr>
        <tr><td><code>@move</code></td><td>拖动结束抛出新坐标；组件不改传入的数据，是否落库由调用方决定</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.flow-demo { display: flex; flex-direction: column; gap: var(--i-spacing-3); width: 100%; }
.hint { font-size: var(--i-font-size-sm); color: var(--i-color-text-tertiary); }
</style>
