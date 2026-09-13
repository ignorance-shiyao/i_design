<script setup lang="ts">
import { computed, ref } from 'vue'
import IFlow from '@/components/IFlow.vue'
import IButton from '@/components/IButton.vue'
import ISpace from '@/components/ISpace.vue'
import ISegmented from '@/components/ISegmented.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { autoLayout, type FlowEdge, type FlowGroup, type FlowNode } from '@i-design/common'

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
</style>
