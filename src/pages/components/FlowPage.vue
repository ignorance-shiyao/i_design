<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IFlow from '@/components/IFlow.vue'
import IButton from '@/components/IButton.vue'
import ISpace from '@/components/ISpace.vue'
import ISegmented from '@/components/ISegmented.vue'
import ISchemaForm from '@/components/ISchemaForm.vue'
import ISelect from '@/components/ISelect.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import {
  autoLayout,
  canConnect,
  connectEdge,
  createNode,
  defaultNodeRegistry,
  deleteNodes,
  disconnectEdge,
  insertNode,
  resolvePropertySchema,
  seedApprovalGraph,
  setEdgeType,
  toFlowEdges,
  toFlowNodes,
  updateNodeData,
  updateNodeLabel,
  validateWiring,
  type EdgeIssue,
  type FlowEdge,
  type FlowGroup,
  type FlowNode,
  type FormSchema,
  type GraphDocument,
  type GraphKind
} from '@i-design/common'

const edges: FlowEdge[] = [
  { from: 'start', to: 'fill' },
  { from: 'fill', to: 'review' },
  { from: 'review', to: 'approve', label: '通过' },
  { from: 'review', to: 'reject', label: '驳回' },
  /*
   * 回边指定从右侧绕回去。自动选会让它贴着主干直上直下，
   * 和「填写材料 → 主管审批」那条正向线叠在一起，两条线分不出哪条是哪条。
   */
  { from: 'reject', to: 'fill', fromSide: 'right', toSide: 'right' },
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
const selection = ref<string[]>([])
const groups = ref<FlowGroup[]>([])

/*
 * 一次操作可能动到多个节点（框选后批量拖动），因此收到的是一组几何而不是一个。
 * 用一次 map 全部应用，而不是逐条 emit——逐条会让画面在中间态闪一下。
 */
function onMove(changes: { id: string; x: number; y: number; width?: number; height?: number }[]) {
  const byId = new Map(changes.map((c) => [c.id, c]))
  nodes.value = nodes.value.map((n) => {
    const next = byId.get(n.id)
    return next ? { ...n, ...next } : n
  })
}

const selectedLabels = computed(() =>
  selection.value.map((id) => nodes.value.find((n) => n.id === id)?.label).filter(Boolean).join('、')
)

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

/*
 * E02：文档真相是 GraphDocument；画布只吃投影。
 * 工具箱 / 删除 / 属性表全部走注册表，不改 IFlow。
 */
const registry = defaultNodeRegistry
const graphDoc = ref<GraphDocument>(seedApprovalGraph(registry))
const graphSelection = ref<string[]>([])
const propertyValues = ref<Record<string, unknown>>({})
const propertySchema = ref<FormSchema | null>(null)
const propertyHint = ref('点画布上的节点看属性；左侧工具箱可插入新类型。')

const graphFlowNodes = computed(() => toFlowNodes(graphDoc.value, registry))
const graphFlowEdges = computed(() => toFlowEdges(graphDoc.value))
const toolbox = computed(() => registry.list())

watch(
  () => graphSelection.value.slice(),
  (ids) => {
    const id = ids[0]
    if (!id) {
      propertySchema.value = null
      propertyValues.value = {}
      propertyHint.value = '点画布上的节点看属性；左侧工具箱可插入新类型。'
      return
    }
    const resolved = resolvePropertySchema(registry, graphDoc.value, id)
    if (resolved.status === 'editable') {
      propertySchema.value = resolved.schema
      propertyValues.value = { ...(graphDoc.value.nodes.find((n) => n.id === id)?.data ?? {}) }
      propertyHint.value = `正在编辑「${graphDoc.value.nodes.find((n) => n.id === id)?.label ?? id}」`
      return
    }
    propertySchema.value = null
    propertyValues.value = {}
    propertyHint.value = resolved.reason
  }
)

function addFromToolbox(type: string) {
  const count = graphDoc.value.nodes.length
  const node = createNode(registry, type, {
    x: 40 + (count % 4) * 180,
    y: 40 + Math.floor(count / 4) * 100
  })
  if (!node) return
  const inserted = insertNode(graphDoc.value, node)
  if (inserted.status === 'ok') {
    graphDoc.value = inserted.document
    graphSelection.value = [node.id]
  }
}

function removeSelected() {
  if (!graphSelection.value.length) return
  graphDoc.value = deleteNodes(graphDoc.value, graphSelection.value)
  graphSelection.value = []
}

function onPropertyUpdate(values: Record<string, unknown>) {
  const id = graphSelection.value[0]
  if (!id) return
  propertyValues.value = values
  let next = updateNodeData(graphDoc.value, id, values)
  if (typeof values.title === 'string' && values.title.trim()) {
    next = updateNodeLabel(next, id, values.title.trim())
  } else if (typeof values.approver === 'string' && values.approver.trim()) {
    next = updateNodeLabel(next, id, values.approver.trim())
  }
  graphDoc.value = next
}

function resetGraphDemo() {
  graphDoc.value = seedApprovalGraph(registry)
  graphSelection.value = []
}

/*
 * E03：连线自己也要被校验。
 * 面板上的每一条都带着 target，点一下就能定位到那条线或那个端口——
 * 一句「连线非法」等于没说，用户只能一条条试。
 */
const graphKind = ref<GraphKind>('cyclic')
const kindOptions = [
  { label: '状态机（允许回环）', value: 'cyclic' },
  { label: 'DAG（禁止成环）', value: 'dag' }
]
const EDGE_TYPES = ['flow', 'reject'] as const
const wiringDoc = ref<GraphDocument>(seedApprovalGraph(registry))
const fromPick = ref<string | null>(null)
const toPick = ref<string | null>(null)
const edgeTypePick = ref<string>('flow')
const wiringNotice = ref('选一个出口和一个入口，连线会先过一遍校验。')
const focusedTarget = ref('')

/** 端口下拉的选项：值写成 node.port，读起来就知道连的是哪一头 */
function portOptions(side: 'in' | 'out') {
  return wiringDoc.value.nodes.flatMap((node) =>
    (node.ports ?? [])
      .filter((port) => port.side === side)
      .map((port) => ({
        value: `${node.id}.${port.id}`,
        label: `${node.label} · ${port.label ?? port.id}`
      }))
  )
}

const outPorts = computed(() => portOptions('out'))
const inPorts = computed(() => portOptions('in'))

const wiringOptions = computed(() => ({
  kind: graphKind.value,
  edgeTypes: EDGE_TYPES as readonly string[]
}))

const wiringFlowNodes = computed(() => toFlowNodes(wiringDoc.value, registry))
const wiringFlowEdges = computed(() => toFlowEdges(wiringDoc.value))
const wiringIssues = computed<EdgeIssue[]>(() => validateWiring(wiringDoc.value, wiringOptions.value))

function splitPick(pick: string | null) {
  if (!pick) return null
  const at = pick.lastIndexOf('.')
  return { node: pick.slice(0, at), port: pick.slice(at + 1) }
}

const candidate = computed(() => {
  const from = splitPick(fromPick.value)
  const to = splitPick(toPick.value)
  if (!from || !to) return null
  return {
    from: from.node,
    to: to.node,
    fromPort: from.port,
    toPort: to.port,
    type: edgeTypePick.value
  }
})

/* 拖到一半就变红，比松手之后弹一句错误好：后者用户已经做完了动作 */
const preview = computed(() =>
  candidate.value
    ? canConnect(wiringDoc.value, candidate.value, wiringOptions.value)
    : { ok: false, reason: '' }
)

function connect() {
  if (!candidate.value) return
  const result = connectEdge(wiringDoc.value, candidate.value, wiringOptions.value)
  if (result.status === 'ok') {
    wiringDoc.value = result.document
    wiringNotice.value = `已连：${result.edge.from}.${result.edge.fromPort} → ${result.edge.to}.${result.edge.toPort}`
    focusedTarget.value = `edge:${result.edge.id}`
    return
  }
  wiringNotice.value = result.issues[0].message
  focusedTarget.value = result.issues[0].target
}

function dropEdge(id: string) {
  wiringDoc.value = disconnectEdge(wiringDoc.value, id)
  wiringNotice.value = `已断开 ${id}`
  focusedTarget.value = ''
}

function switchEdgeType(id: string, type: string) {
  const result = setEdgeType(wiringDoc.value, id, type, wiringOptions.value)
  if (result.status === 'ok') {
    wiringDoc.value = result.document
    wiringNotice.value = `${id} 的类型改成了 ${type}`
    return
  }
  wiringNotice.value = result.issues[0].message
  focusedTarget.value = result.issues[0].target
}

/** 面板点一条问题：把它记成当前焦点，画布与列表同时高亮 */
function focusIssue(issue: EdgeIssue) {
  focusedTarget.value = issue.target
  wiringNotice.value = issue.message
}

function resetWiring() {
  wiringDoc.value = seedApprovalGraph(registry)
  fromPick.value = null
  toPick.value = null
  edgeTypePick.value = 'flow'
  focusedTarget.value = ''
  wiringNotice.value = '选一个出口和一个入口，连线会先过一遍校验。'
}

/** 故意连出一条坏线：悬空 + 成环，用来看校验面板真的报得出来 */
function injectBadEdges() {
  wiringDoc.value = {
    ...wiringDoc.value,
    edges: [
      ...wiringDoc.value.edges,
      { id: 'loose-1', from: 'n-approve', to: 'n-ghost', type: 'flow' },
      { id: 'back-1', from: 'n-end', to: 'n-start', type: 'flow' }
    ]
  }
  wiringNotice.value = '已塞进一条悬空边与一条回边，校验面板应当逐条点名。'
}

function injectUnknown() {
  graphDoc.value = {
    ...graphDoc.value,
    nodes: [
      ...graphDoc.value.nodes,
      {
        id: `unknown-${graphDoc.value.nodes.length + 1}`,
        type: 'legacy-vendor',
        x: 40,
        y: 280,
        label: '旧插件节点',
        data: { vendor: 'acme' }
      }
    ]
  }
}
</script>

<template>
  <article>
    <h1>流程图</h1>
    <p class="i-lead">
      审批链、状态机、数据流向——这些东西写成文字要读三遍，画成图一眼就懂。画布负责摆放与交互，节点形状承担语义：开始与结束是胶囊，判断是菱形，其余是矩形。形状比颜色可靠——打印成黑白或读者有色觉障碍时，颜色会失效，形状不会。
    </p>

    <DemoBlock
      title="可拖拽的流程画布"
      description="拖动节点调整位置：与邻近节点对齐时出现辅助线并吸附，没对上则回到网格，拖动空白处平移。开启框选或按住 Shift 拖出选框可多选，选中一个节点时四角出现手柄可改尺寸。左下角缩略图点哪跳哪，工具条可导出 SVG。"
    >
      <div class="flow-demo">
        <ISpace>
          <IButton size="sm" @click="relayout">重新布局</IButton>
          <IButton size="sm" :variant="readonly ? 'primary' : 'secondary'" @click="readonly = !readonly">
            {{ readonly ? '只读中' : '可编辑' }}
          </IButton>
          <ISegmented v-model="edgeType" :options="edgeTypes" />
          <span class="hint">{{ selection.length ? `已选中：${selectedLabels}` : '未选中节点' }}</span>
        </ISpace>
        <IFlow
          v-model:selection="selection"
          v-model:groups="groups"
          :nodes="nodes"
          :edges="edges"
          :edge-type="edgeType"
          :readonly="readonly"
          @move="onMove"
        />
      </div>
    </DemoBlock>

    <DemoBlock
      title="节点工具箱与属性检查器"
      description="左侧工具箱来自 NodeRegistry：加一种业务节点只需往注册表塞定义，不必改画布。选中节点后右侧用 SchemaForm 编辑 data；删节点会同步清掉相连的边与分组成员。注入「旧插件」可看未知类型的只读占位。"
    >
      <div class="registry-demo">
        <ISpace>
          <IButton size="sm" @click="resetGraphDemo">重置示例</IButton>
          <IButton size="sm" variant="secondary" @click="injectUnknown">注入未知类型</IButton>
          <IButton
            size="sm"
            variant="danger"
            :disabled="!graphSelection.length"
            @click="removeSelected"
          >
            删除选中
          </IButton>
          <span class="hint">{{ propertyHint }}</span>
        </ISpace>
        <div class="registry-demo__body">
          <aside class="registry-demo__toolbox" aria-label="节点工具箱">
            <p class="registry-demo__caption">工具箱</p>
            <IButton
              v-for="item in toolbox"
              :key="item.type"
              size="sm"
              variant="secondary"
              @click="addFromToolbox(item.type)"
            >
              {{ item.label }}
            </IButton>
          </aside>
          <div class="registry-demo__canvas">
            <IFlow
              v-model:selection="graphSelection"
              :nodes="graphFlowNodes"
              :edges="graphFlowEdges"
              edge-type="polyline"
            />
          </div>
          <aside class="registry-demo__inspector" aria-label="属性检查器">
            <p class="registry-demo__caption">属性</p>
            <ISchemaForm
              v-if="propertySchema"
              :schema="propertySchema"
              :model-value="propertyValues"
              submit-text="应用到节点"
              @update:model-value="onPropertyUpdate"
            />
            <p v-else class="hint">{{ propertyHint }}</p>
          </aside>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="端口连线与校验面板"
      description="连线先过校验再落到文档上：方向按端口的 in / out 判，端口必须真的存在，同一对端口之间的第二条线会被拒。环按图类型处理——状态机的驳回回边是正常语义，DAG 里一个环就是死循环。面板上的每一条都点得过去，而不是只说一句「连线非法」。"
    >
      <div class="wiring-demo">
        <ISpace>
          <ISegmented v-model="graphKind" :options="kindOptions" />
          <IButton size="sm" @click="resetWiring">重置示例</IButton>
          <IButton size="sm" variant="secondary" @click="injectBadEdges">塞一条坏线</IButton>
        </ISpace>
        <div class="wiring-demo__form">
          <ISelect
            v-model="fromPick"
            class="wiring-demo__pick"
            size="sm"
            :options="outPorts"
            placeholder="从哪个出口"
            aria-label="连线起点端口"
          />
          <ISelect
            v-model="toPick"
            class="wiring-demo__pick"
            size="sm"
            :options="inPorts"
            placeholder="到哪个入口"
            aria-label="连线终点端口"
          />
          <ISelect
            v-model="edgeTypePick"
            class="wiring-demo__pick"
            size="sm"
            :options="[
              { value: 'flow', label: '流转 flow' },
              { value: 'reject', label: '驳回 reject' },
              { value: 'data', label: '数据 data（白名单外）' }
            ]"
            aria-label="连线类型"
          />
          <IButton size="sm" variant="primary" :disabled="!candidate" @click="connect">连线</IButton>
          <span v-if="candidate && !preview.ok" class="wiring-demo__preview" role="status">
            连不上：{{ preview.reason }}
          </span>
        </div>
        <p class="wiring-demo__notice" role="status">{{ wiringNotice }}</p>
        <div class="wiring-demo__body">
          <div class="wiring-demo__canvas">
            <IFlow :nodes="wiringFlowNodes" :edges="wiringFlowEdges" edge-type="polyline" readonly />
          </div>
          <div class="wiring-demo__side">
            <section class="wiring-demo__panel" aria-label="连线列表">
              <p class="wiring-demo__caption">连线</p>
              <ul class="wiring-demo__list">
                <li
                  v-for="edge in wiringDoc.edges"
                  :key="edge.id"
                  class="wiring-demo__row"
                  :class="{ 'is-focused': focusedTarget === `edge:${edge.id}` }"
                >
                  <span class="wiring-demo__edge">
                    {{ edge.id }}：{{ edge.from }}.{{ edge.fromPort ?? '—' }} →
                    {{ edge.to }}.{{ edge.toPort ?? '—' }}（{{ edge.type ?? '未标类型' }}）
                  </span>
                  <span class="wiring-demo__row-actions">
                    <IButton
                      size="sm"
                      variant="text"
                      @click="switchEdgeType(edge.id, edge.type === 'reject' ? 'flow' : 'reject')"
                    >
                      换类型
                    </IButton>
                    <IButton size="sm" variant="text" @click="dropEdge(edge.id)">断开</IButton>
                  </span>
                </li>
              </ul>
            </section>
            <section class="wiring-demo__panel" aria-label="校验面板">
              <p class="wiring-demo__caption">
                校验
                <span v-if="wiringIssues.length" class="wiring-demo__count">
                  {{ wiringIssues.length }} 处待修
                </span>
              </p>
              <ul v-if="wiringIssues.length" class="wiring-demo__list">
                <li v-for="issue in wiringIssues" :key="issue.target + issue.code">
                  <button
                    type="button"
                    class="wiring-demo__issue"
                    :class="{ 'is-focused': focusedTarget === issue.target }"
                    @click="focusIssue(issue)"
                  >
                    <span class="wiring-demo__issue-code">{{ issue.code }}</span>
                    <span class="wiring-demo__issue-text">{{ issue.message }}</span>
                    <span class="wiring-demo__issue-target">{{ issue.target }}</span>
                  </button>
                </li>
              </ul>
              <p v-else class="hint">这张图现在没有连线问题。</p>
            </section>
          </div>
        </div>
      </div>
    </DemoBlock>

    <h2>从哪条边出线</h2>
    <p>
      默认按两点方位自动选一条边，多数时候是对的。但有两种图非指定不可：回边——「驳回 → 重新填写」应当从侧面绕回去，自动选会让它贴着主干直上直下，和正向的线叠在一起；以及同一对节点之间的多条线，自动选会把它们全压成一条。给这条连线加 <code>fromSide</code> / <code>toSide</code> 即可，上面那张图的回边用的就是 <code>fromSide: 'right'</code>。
    </p>

    <h2>自动布局</h2>
    <p>
      只给节点与连线，不必手填坐标：按从入口出发的最长路径排层，同层横向居中铺开。回边会被跳过——审批流里「驳回 → 重新填写」是一条回边，顺着它继续推深度，整张图会一层层往下漂，层数变得和节点数一样多。手工调整过的节点保留坐标，自动布局只填未定位的那些。
    </p>

    <h2>多选与批量移动</h2>
    <p>
      按住 Shift 拖出选框，或点开工具条上的框选再拖——触摸端没有修饰键，所以框选也做成了一个显式开关。判定用「整个节点都在框内」而不是「相交」：相交判定下，框边缘扫过的节点会被顺手选中，而拖框经过一个节点却没打算选它，是这里最常见的误操作。
    </p>
    <p>
      拖动组里任意一个节点，整组一起走。位移量整体吸附一次网格，而不是各自吸附——逐个吸附会把组内原本的相对间距抹平：两个相距 12px 的节点各自对齐到 8 格后会变成 8px 或 16px，一次批量移动就把手工排好的版毁了。撤销也按「一次操作」记：批量拖动的十个节点撤销一次全退回去，按十次才回到原处的撤销和没有撤销差不多。
    </p>

    <h2>节点分组</h2>
    <p>
      选中两个以上的节点，点工具条上的成组按钮，它们外面会出现一个虚线框与一行标题。组不改节点坐标，只是在它们外面画一个框——分组说的是「这几个是一回事」，不是「把它们搬到一起」，动坐标会把手工排好的版打乱。少于两个节点时按钮置灰：一个节点的「组」除了多一个框什么也没说。
    </p>
    <p>
      点标题左边的折叠按钮，组内节点收成一个代表方块，方块上写着组名与成员数。连到组内的线跟着改指向这个方块，而不是随成员一起消失——否则那几条线会指向空气。两端都在同一个折叠组里的线直接去掉，它画出来是一条从组连回自己的自环；重定向之后重复的线也会合并成一条。代表方块用虚线描边，与真节点区分开，再点一下它就展开。
    </p>

    <h2>改尺寸</h2>
    <p>
      恰好选中一个节点时四角出现手柄。多选时不给手柄——拖角改的是哪一个并不清楚。拖动时对角固定不动：右下角往外拉，左上角不该跟着跑，否则节点会一边变大一边平移，手感像在拖整个节点而不是在改尺寸。尺寸到下限后位置也跟着停住，只夹尺寸的话，拖过头时节点会继续往反方向滑。
    </p>

    <h2>缩略图与导出</h2>
    <p>
      左上角是整张图的缩小版加一个取景框，点哪里就跳到哪里。横纵取同一个缩放比并居中，而不是各自拉伸：分别缩放会让缩略图里的节点与主画布长宽比不同，那样它就不再是同一张图的缩小版，指路作用也就没了。
    </p>
    <p>
      导出的是整张图，不是当前视口——按视口导出，用户拿到的文件会缺掉他没滚动到的部分，而他并不会察觉。工具条、选框、手柄这些编辑器界面件会先摘掉。Web 端序列化 SVG
      并把令牌与样式内联进文件：SVG 一旦脱离页面就拿不到 CSS 变量，不内联的话打开是一堆黑框。
      Flutter 走 <code>RepaintBoundary</code>，小程序走 <code>canvasToTempFilePath</code>——三端机制不同，但导出的都是同一张图。
    </p>

    <h2>连线</h2>
    <p>
      用直角折线而不是直连斜线：斜线穿过其他节点时很难辨认走向，直角折线的每一段都平行于画布，视线可以顺着走。端点吸附到节点边缘中点而不是中心，否则箭头会钻进节点里被填充盖住。连线标签底下垫一块底色，不垫的话线会从字中间穿过去。
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
            整图默认连线走向：<code>polyline</code> 折线（默认，每段平行于画布，最适合审批流）、<code>straight</code> 直连、<code>bezier</code> 曲线（同一对节点间有多条线时更好读）。单条连线可用 <code>edge.type</code> 覆盖。
          </td>
        </tr>
        <tr>
          <td><code>selection</code></td>
          <td>选中的节点 id 数组，支持 v-model。单选也是长度为 1 的数组——两套选中状态迟早会对不上</td>
        </tr>
        <tr>
          <td><code>groups</code></td>
          <td>分组数组，支持 v-model：id、标题、成员 id 与是否折叠。折叠后组内节点收成一个代表方块</td>
        </tr>
        <tr><td><code>readonly</code></td><td>只读：仍可平移缩放与选中，但不能拖动或缩放节点</td></tr>
        <tr><td><code>export-name</code></td><td>导出 SVG 的文件名（不含扩展名）</td></tr>
        <tr>
          <td><code>@move</code></td>
          <td>拖动或缩放结束抛出一组新几何；组件不改传入的数据，是否落库由调用方决定</td>
        </tr>
      </tbody>
    </table>
    <h2>什么时候不该用它</h2>
    <ul>
      <li>节点之间只是先后顺序、没有分支时——用步骤条，画布的自由度在这里是负担。</li>
      <li>图只是用来看、不用改时——导出一张图片或用静态图示，一个可拖拽的画布会诱使人去动它。</li>
      <li>节点上千时——先分层折叠或只画当前视野内的部分，全量渲染会把交互拖垮。</li>
    </ul>
  </article>
</template>

<style scoped>
.flow-demo { display: flex; flex-direction: column; gap: var(--i-spacing-3); width: 100%; }
.hint { font-size: var(--i-font-size-sm); color: var(--i-color-text-tertiary); }
.registry-demo {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-3);
  width: 100%;
  min-width: 0;
}
.registry-demo__body {
  display: grid;
  grid-template-columns: minmax(7rem, 9rem) minmax(0, 1fr) minmax(12rem, 16rem);
  gap: var(--i-spacing-3);
  align-items: start;
}
.registry-demo__toolbox,
.registry-demo__inspector {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-2);
  min-width: 0;
  padding: var(--i-spacing-3);
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-md);
  background: var(--i-color-bg-subtle);
}
.registry-demo__caption {
  margin: 0;
  font-size: var(--i-font-size-sm);
  font-weight: 600;
  color: var(--i-color-text-secondary);
}
.registry-demo__canvas { min-width: 0; }
.wiring-demo {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-3);
  width: 100%;
  min-width: 0;
}
.wiring-demo__form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--i-spacing-2);
}
.wiring-demo__pick { width: min(220px, 100%); }
.wiring-demo__preview,
.wiring-demo__notice {
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
  max-width: 45em;
}
.wiring-demo__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(min(320px, 100%), 24rem);
  gap: var(--i-spacing-3);
  align-items: start;
}
.wiring-demo__canvas { min-width: 0; }
.wiring-demo__side {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-3);
  min-width: 0;
}
.wiring-demo__panel {
  min-width: 0;
  padding: var(--i-spacing-3);
  /* 四边等宽发丝线：状态与类型靠图标和淡底色块说，不靠加粗某一条边 */
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
  background: var(--i-color-bg-subtle);
}
.wiring-demo__caption {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  margin: 0 0 var(--i-spacing-2);
  font-size: var(--i-font-size-sm);
  font-weight: 600;
  color: var(--i-color-text-secondary);
}
.wiring-demo__count {
  padding: 0 var(--i-spacing-2);
  border-radius: var(--i-radius-full);
  background: var(--i-color-danger-subtle);
  color: var(--i-color-danger-text);
  font-size: var(--i-font-size-xs);
  font-weight: 400;
}
.wiring-demo__list {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-1);
  margin: 0;
  padding: 0;
  list-style: none;
}
.wiring-demo__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-1);
  font-size: var(--i-font-size-sm);
}
.wiring-demo__row.is-focused { color: var(--i-color-brand-text); }
.wiring-demo__edge {
  min-width: 0;
  overflow-wrap: anywhere;
}
.wiring-demo__row-actions { display: flex; gap: var(--i-spacing-1); }
.wiring-demo__issue {
  display: grid;
  gap: 2px;
  width: 100%;
  border: 1px solid transparent;
  border-radius: var(--i-radius-sm);
  padding: var(--i-spacing-1) var(--i-spacing-2);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.wiring-demo__issue:hover,
.wiring-demo__issue.is-focused {
  border-color: var(--i-color-hairline);
  background: var(--i-color-bg-elevated);
}
.wiring-demo__issue-code {
  color: var(--i-color-danger-text);
  font-size: var(--i-font-size-xs);
}
.wiring-demo__issue-text {
  font-size: var(--i-font-size-sm);
  max-width: 45em;
  overflow-wrap: anywhere;
}
.wiring-demo__issue-target {
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-xs);
}
@media (max-width: 900px) {
  .wiring-demo__body { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .registry-demo__body { grid-template-columns: 1fr; }
}
</style>
