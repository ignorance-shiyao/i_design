<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildRetention, type RetentionCohortInput } from '@i-design/common'
import IChartRetention from '@/components/IChartRetention.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const selectedId = ref('')
const state = ref('normal')

/*
 * 演示数据要能演出正文说的那几件事：
 * 老批次到得了第 4 期、新批次只到第 1 期（三角形），第 2 期有回流（80 → 62），
 * 以及最后一批人数少、留存高——幸存者平均正是这么来的。
 */
const source: RetentionCohortInput[] = [
  { id: '2026-01', label: '1 月进来的', size: 1200, values: [720, 540, 480, 444] },
  { id: '2026-02', label: '2 月进来的', size: 1500, values: [975, 750, 660, null] },
  { id: '2026-03', label: '3 月进来的', size: 900, values: [558, 432, null, null] },
  { id: '2026-04', label: '4 月进来的', size: 300, values: [246, null, null, null] }
]

const conflicting: RetentionCohortInput[] = [
  { id: '2026-01', label: '1 月进来的', size: 1200, values: [720, 1300] },
  ...source.slice(1, 3)
]

const noDenominator: RetentionCohortInput[] = [
  { id: 'missing', label: '没报期初的那批', size: null, values: [100, 80] },
  ...source.slice(0, 2)
]

const model = computed(() =>
  buildRetention(
    state.value === 'empty'
      ? []
      : state.value === 'conflict'
        ? conflicting
        : state.value === 'no-size'
          ? noDenominator
          : source,
    { unit: ' 人' }
  )
)
const selected = computed(() => model.value.cohorts.find(cohort => cohort.id === selectedId.value))

function changeState(value: string) {
  state.value = value
  selectedId.value = ''
}
</script>

<template>
  <article class="doc-page retention-page">
    <h1>留存</h1>
    <p class="i-lead">按批次看「进来的人还剩多少」。表上的每个百分比都要答得出同一个问题：分母是哪一批人、第几期。答不上来的百分比没有意义，答错的比答不上来更糟——它看起来一样正经。</p>

    <h2>分母是这一批的期初，不是上一期</h2>
    <p>「第 3 期留存 80%」，是一百个人里还剩八十，还是第 2 期的八十人里还剩六十四？两个数都叫留存，差着十六个百分点。这里只认前者，口径一直印在图上。要看逐期流失率，那是另一列数，不能混在同一张表里——混了之后连写这张图的人都说不清看到的是哪个。</p>

    <h2>空格是「还没到」，不是 0</h2>
    <p>上个月才进来的那批，第 4 期根本还没发生。画成 0，曲线会在右下角齐刷刷跌到底，看起来像产品突然崩了。所以未到期是空格，连底色都不涂——最浅的那一档是「几乎没人留下」，和「还没到」是两回事。</p>

    <h2>右边几期的平均是幸存者平均</h2>
    <p>第 4 期只有最老的批次到得了，把到得了的批次平均一下，得到的是幸存者的平均：它几乎必然高于真实水平，而且会随新批次加入忽上忽下。所以平均那一行会标出「用了几个批次」，没到齐的那几期另给一个文字角标，而不是让人以为它和左边几期能比。</p>

    <DemoBlock
      title="按月批次的留存"
      description="点批次名或用 Tab 与 Enter 选中一行；切换状态可以看到矛盾数据与没有分母的批次怎么处理。"
      lang="vue"
      code="const model = buildRetention(source, { unit: ' 人' })"
    >
      <div class="retention-demo">
        <div class="retention-controls" aria-label="示例数据状态">
          <IButton :aria-pressed="state === 'normal'" @click="changeState('normal')">三角形与回流</IButton>
          <IButton :aria-pressed="state === 'conflict'" @click="changeState('conflict')">比期初还多</IButton>
          <IButton :aria-pressed="state === 'no-size'" @click="changeState('no-size')">没有分母</IButton>
          <IButton :aria-pressed="state === 'empty'" @click="changeState('empty')">空数据</IButton>
        </div>
        <IChartRetention :model="model" :selected-id="selectedId" title="按月批次的留存" @select="selectedId = $event" />
        <p class="retention-selection" role="status">
          {{ selected ? `已选：${selected.label}，期初 ${selected.sizeText}，到得了第 ${selected.reach} 期` : '尚未选择批次' }}
        </p>
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>批次之间人数差得很远时，别只看平均那一行：三百人的批次和一千五百人的批次在平均里权重一样。</li>
      <li>要判断「某次改版有没有用」时不用：留存表看得出差异，看不出因果，同期还有别的变化。</li>
      <li>只关心当前活跃总量时用趋势折线：留存回答的是「哪一批人留下了」，不是「现在有多少人」。</li>
    </ul>

    <h2>模型与交互</h2>
    <p>用 buildRetention 生成 model，传入 title 与 selectedId；select 返回稳定批次 ID。各端接收同一个可序列化模型，色阶档位也由共享逻辑按比例本身算——不按本图内排名归一化，否则两张留存图就比不了了。小程序事件的 ID 位于 detail.id，Flutter 使用 onSelect 回调并额外接收 retentionShade 的结果。</p>
    <p>期初人数缺失、为零或不是正数的批次整批列为未计入并说明原因，不画成 0%；某一期留下的人比期初还多属于口径矛盾，同样整批作废。空 ID 与重复 ID 返回无效状态。回流让某一期比上一期多是正常的，不算矛盾。</p>
  </article>
</template>

<style scoped>
.retention-demo { width: 100%; min-width: 0; }
.retention-page p { max-width: 45em; }
.retention-page li { max-width: 45em; }
.retention-controls { display: flex; flex-wrap: wrap; gap: var(--i-spacing-2); margin-bottom: var(--i-spacing-4); }
.retention-selection { margin-top: var(--i-spacing-3); color: var(--i-color-text-secondary); }
</style>
