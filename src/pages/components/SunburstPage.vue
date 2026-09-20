<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildHierarchy, type HierarchyInput } from '@i-design/common'
import IChartSunburst from '@/components/IChartSunburst.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const selectedId = ref('')
const focusId = ref('')
const state = ref('gap')

/*
 * 演示数据要能演出这页的正文说的那件事，否则那段话就是空话。
 * 这里「直销」自报 120，下面两条明细只报到 90——差额 30 就是「未细分」那一块。
 */
const source: HierarchyInput[] = [
  { id: 'direct', parentId: null, label: '直销', value: 120 },
  { id: 'direct-key', parentId: 'direct', label: '大客户', value: 60 },
  { id: 'direct-sme', parentId: 'direct', label: '中小客户', value: 30 },
  { id: 'channel', parentId: null, label: '渠道', value: null },
  { id: 'channel-agent', parentId: 'channel', label: '代理商', value: 50 },
  { id: 'channel-shop', parentId: 'channel', label: '门店', value: 30 },
  { id: 'online', parentId: null, label: '线上', value: 40 },
  { id: 'unknown', parentId: null, label: '归属待补录', value: null }
]

const conflicting: HierarchyInput[] = [
  { id: 'direct', parentId: null, label: '直销', value: 100 },
  { id: 'direct-key', parentId: 'direct', label: '大客户', value: 70 },
  { id: 'direct-sme', parentId: 'direct', label: '中小客户', value: 50 }
]

const excluded: HierarchyInput[] = [
  ...source.slice(0, 3),
  { id: 'refund', parentId: null, label: '退货冲减', value: -20 }
]

const model = computed(() =>
  buildHierarchy(
    state.value === 'empty'
      ? []
      : state.value === 'conflict'
        ? conflicting
        : state.value === 'excluded'
          ? excluded
          : source,
    { unit: ' 万' }
  )
)
const selected = computed(() => model.value.nodes.find(node => node.id === selectedId.value))

function changeState(value: string) {
  state.value = value
  selectedId.value = ''
  focusId.value = ''
}
</script>

<template>
  <article class="doc-page sunburst-page">
    <h1>旭日图</h1>
    <p class="i-lead">
      看一整块量是怎么一层层分下去的：内圈是上级，外圈是它的下级，同一支各层同色。双击一段可以只看它，中心的数字跟着换成这一支的量。
    </p>

    <h2>父级与下级对不上时</h2>
    <p>
      示例为虚构的销售构成。「直销」自报 120 万，下面两条明细只报到 90 万——差额 30 万不会被悄悄抹掉，也不会改掉「直销」自报的数，而是单列成一块「未细分」，有自己的扇段和清单条目，点得中、读得出。反过来下级之和超过父级是矛盾而不是缺口，补不出来，整张图判为无效并指名是哪个节点。
    </p>
    <DemoBlock
      title="销售构成"
      description="点扇段或用 Tab 与 Enter 选择，双击扇段下钻；切换状态可以看到未细分、矛盾数据、排除项与空数据。"
      lang="vue"
      code="const model = buildHierarchy(source, { unit: ' 万' })"
    >
      <div class="sunburst-demo">
        <div class="sunburst-controls" aria-label="示例数据状态">
          <IButton :aria-pressed="state === 'gap'" @click="changeState('gap')">下级没报全</IButton>
          <IButton :aria-pressed="state === 'conflict'" @click="changeState('conflict')">下级超过父级</IButton>
          <IButton :aria-pressed="state === 'excluded'" @click="changeState('excluded')">含排除项</IButton>
          <IButton :aria-pressed="state === 'empty'" @click="changeState('empty')">空数据</IButton>
        </div>
        <IChartSunburst
          :model="model"
          :focus-id="focusId"
          :selected-id="selectedId"
          title="销售构成"
          @select="selectedId = $event"
          @focus="focusId = $event"
        />
        <p class="sunburst-selection" role="status">
          {{ selected ? `已选：${selected.description}` : '尚未选择节点' }}
        </p>
      </div>
    </DemoBlock>

    <h2>两个分母</h2>
    <p>
      一段占 12%，是占全体还是占它的上级？两者差着一整层的语义，所以清单里两个都念出来：「占全体」用根合计作分母，「占上级」用直接父级作分母。下钻只改变画多大，不改变分母——焦点变了不等于数据变了。
    </p>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>层级超过三四层时不用：最外圈的扇段会细到点不中，改用可展开的树表。</li>
      <li>要比较同层之间的大小时不用：圆环上的角度比长度难比，用条形图。</li>
      <li>分类超过八支时不用：颜色不再区分得开，先在数据侧合并成「其他」。</li>
    </ul>

    <h2>模型与交互</h2>
    <p>
      用 buildHierarchy 生成 model，传入 title、focusId、selectedId 与 size；
      select 返回稳定节点 ID，focus 返回下钻焦点（空串表示返回全部）。各端接收同一个可序列化模型，扇段的角度、半径与取色号也都来自共享逻辑，因此排序、分母、层级与颜色分配在各端一致。小程序事件的 ID 位于 detail.id，
      Flutter 使用 onSelect / onFocus 回调。
    </p>
    <p>
      空 ID、重复 ID、指向不存在的父级、父子成环，以及下级之和超过父级，都会返回无效状态并说明原因。缺失值、负值与非有限数不进分母，连同它们的整条下级一起列为排除项，源行号始终可查。
    </p>
  </article>
</template>

<style scoped>
.sunburst-demo { width: 100%; min-width: 0; }
.sunburst-page p { max-width: 45em; }
.sunburst-page li { max-width: 45em; }
.sunburst-controls { display: flex; flex-wrap: wrap; gap: var(--i-spacing-2); margin-bottom: var(--i-spacing-4); }
.sunburst-selection { margin-top: var(--i-spacing-3); color: var(--i-color-text-secondary); }
</style>
