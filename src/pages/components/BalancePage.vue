<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildBalance, checkFlowBalance, type BalanceItemInput } from '@i-design/common'
import IChartBalance from '@/components/IChartBalance.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const selectedId = ref('')
const state = ref('balanced')

/* 各项加起来 +33：期初 100 → 算出来 133。「账没平」那一档把期末声称成 140 */
const source: BalanceItemInput[] = [
  { id: 'new', label: '新签', value: 42 },
  { id: 'churn', label: '流失', value: -18 },
  { id: 'upsell', label: '增购', value: 9 },
  { id: 'flat', label: '未续未退', value: 0 },
  { id: 'todo', label: '待补录', value: null }
]

const model = computed(() =>
  buildBalance(
    state.value === 'empty' ? [] : source,
    {
      start: 100,
      end: state.value === 'gap' ? 140 : state.value === 'balanced' ? 133 : null,
      unit: ' 万'
    }
  )
)
const selected = computed(() => model.value.steps.find(step => step.id === selectedId.value))

/* 流量平衡：同一份逻辑，核的是「进来的等于出去的」 */
const flow = computed(() =>
  checkFlowBalance(
    [
      { id: 'warehouse', label: '仓库', inflow: 100, outflow: 100 },
      { id: 'transit', label: '在途', inflow: 100, outflow: 95 },
      { id: 'store', label: '门店', inflow: 95, outflow: 98 }
    ],
    { unit: ' 件' }
  )
)

function changeState(value: string) {
  state.value = value
  selectedId.value = ''
}
</script>

<template>
  <article class="doc-page balance-page">
    <h1>贡献与流量平衡</h1>
    <p class="i-lead">从上期的 A 变成本期的 B，中间是哪些事各推了多少。这张图和构成类的图有一条根本差别：负值是数据，不是脏数据——排除掉就等于把「掉的那部分」从故事里抹了。</p>

    <h2>对不上的差额要摊出来</h2>
    <p>期初 100 万、各项加起来 +33 万、期末声称 140 万，差着 7 万。最常见的做法是把最后一根柱子直接画到 140 了事——图上严丝合缝，而那 7 万是哪来的没人知道。这里把它单列成一项「未解释的差额」，有自己的柱子和名字，谁都能看见账没平。不给期末就不存在对不对得上的问题，那时期末就是算出来的合计。</p>

    <h2>坐标轴含 0，基线不钉死</h2>
    <p>累计跌到 0 以下是常事。把基线钉在 0，负的那一段要么被裁掉、要么被画成正的。范围由数据定，但一定包含 0——不含 0 的贡献图会把「从 100 涨到 102」画得像翻了一倍。</p>
    <p>增减用两个语义色，但颜色不是唯一线索：右边那列数字自带正负号，读屏器念的是完整读法。灰度打印和色觉障碍用户读的是符号。</p>

    <DemoBlock
      title="本期收入的增减"
      description="点一行或用 Tab 与 Enter 选中；切换状态可以看到账平、账没平与不给期末三种情况。"
      lang="vue"
      code="const model = buildBalance(source, { start: 100, end: 140, unit: ' 万' })"
    >
      <div class="balance-demo">
        <div class="balance-controls" aria-label="示例数据状态">
          <IButton :aria-pressed="state === 'balanced'" @click="changeState('balanced')">账是平的</IButton>
          <IButton :aria-pressed="state === 'gap'" @click="changeState('gap')">账没平</IButton>
          <IButton :aria-pressed="state === 'open'" @click="changeState('open')">不给期末</IButton>
          <IButton :aria-pressed="state === 'empty'" @click="changeState('empty')">空数据</IButton>
        </div>
        <IChartBalance :model="model" :selected-id="selectedId" title="本期收入的增减" @select="selectedId = $event" />
        <p class="balance-selection" role="status">{{ selected ? `已选：${selected.description}` : '尚未选择项目' }}</p>
      </div>
    </DemoBlock>

    <h2>流量平衡</h2>
    <p>同一层逻辑还核一件事：一个节点进来的等于出去的吗。进 100、出 95，剩下的 5 是留下了、漏了，还是没统计到？这张图不替谁回答——那要看业务——但必须把 5 摆出来，而不是让进和出各自看起来都对。容差按节点自身的规模取相对值：定一个绝对值，在以亿为单位的账上什么也拦不住，在以克为单位的账上又会把真实差额吃掉。</p>
    <DemoBlock title="逐节点核对进出" description="核对结果与原因都来自 checkFlowBalance。" lang="vue" code="const result = checkFlowBalance(nodes, { unit: ' 件' })">
      <div class="balance-flow">
        <p class="balance-flow__caption">{{ flow.caption }}</p>
        <ul class="balance-flow__list">
          <li v-for="node in flow.nodes" :key="node.id" :class="{ 'is-off': !node.balanced }">
            {{ node.description }}
          </li>
        </ul>
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>项目超过十来项时不用：台阶会细到看不出谁大谁小，先归并再画。</li>
      <li>各项之间会互相抵消、顺序可以随便换时慎用：台阶图读起来像是有先后因果的。</li>
      <li>只想看构成不看增减时用帕累托或旭日：那几张按构成算，负值本来就不适用。</li>
    </ul>

    <h2>模型与交互</h2>
    <p>用 buildBalance 生成 model，传入 start、end 与 unit；select 返回稳定项目 ID。各端接收同一个可序列化模型，台阶的起止、方向与坐标范围都来自共享逻辑。项目顺序照输入给的来——那通常是业务叙述的顺序，自作主张按大小重排会把因果讲反。</p>
    <p>缺失不当成 0：0 是「这项没动」，会画一根零高的柱子；缺失是「这项没报上来」，列为未计入并说明原因。空 ID、重复 ID、与保留 ID 冲突、期初或期末不是有效的数，都返回无效状态。</p>
  </article>
</template>

<style scoped>
.balance-demo { width: 100%; min-width: 0; }
.balance-page p { max-width: 45em; }
.balance-page li { max-width: 45em; }
.balance-controls { display: flex; flex-wrap: wrap; gap: var(--i-spacing-2); margin-bottom: var(--i-spacing-4); }
.balance-selection { margin-top: var(--i-spacing-3); color: var(--i-color-text-secondary); }
.balance-flow { width: 100%; min-width: 0; }
.balance-flow__caption { color: var(--i-color-text-secondary); margin-bottom: var(--i-spacing-3); }
.balance-flow__list { margin: 0; padding-left: var(--i-spacing-5); }
.balance-flow__list li { margin-bottom: var(--i-spacing-2); }
.balance-flow__list li.is-off { color: var(--i-color-text); }
</style>
