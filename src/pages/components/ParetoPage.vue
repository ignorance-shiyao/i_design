<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildPareto, type ParetoInput } from '@i-design/common'
import IChartPareto from '@/components/IChartPareto.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
const selectedId = ref('')
const state = ref('normal')
const source: ParetoInput[] = [
  { id: 'interface', label: '接口异常', value: 20 },
  { id: 'timeout', label: '请求超时', value: 60 },
  { id: 'other', label: '其他原因', value: 20 },
  { id: 'unknown', label: '待补录原因', value: null }
]
const model = computed(() => buildPareto(state.value === 'empty' ? [] : state.value === 'single' ? source.slice(0, 1) : state.value === 'zero' ? source.slice(0, 3).map(row => ({ ...row, value: 0 })) : source, { unit: ' 次' }))
const selected = computed(() => model.value.rows.find(row => row.id === selectedId.value))
function changeState(value: string) { state.value = value; selectedId.value = '' }
</script>

<template>
  <article class="doc-page pareto-page">
    <h1>帕累托图</h1>
    <p class="i-lead">按数量从高到低查看类别构成，再用累计占比判断主要部分由哪些类别组成。柱形从零开始，折线使用独立的百分比刻度。</p>
    <h2>已知数据与累计阈值</h2>
    <p>示例为虚构的请求失败记录。相同数量保持输入次序；缺失值不当作零，排除项及原始行号始终可查。80% 是本例的观察阈值，不是“前两成类别一定贡献八成”的保证。</p>
    <DemoBlock title="失败原因构成" description="点击类别或用 Tab 与 Enter 选择，下方显示同一条数据；切换状态可检查空数据和零分母。" lang="vue" code="const model = buildPareto(source, { unit: ' 次' })">
      <div class="pareto-demo">
        <div class="pareto-controls" aria-label="示例数据状态">
          <IButton :aria-pressed="state === 'normal'" @click="changeState('normal')">有效与缺失</IButton>
          <IButton :aria-pressed="state === 'single'" @click="changeState('single')">单个类别</IButton>
          <IButton :aria-pressed="state === 'zero'" @click="changeState('zero')">全部为零</IButton>
          <IButton :aria-pressed="state === 'empty'" @click="changeState('empty')">空数据</IButton>
        </div>
        <IChartPareto :model="model" :selected-id="selectedId" title="失败原因构成" @select="selectedId = $event" />
        <p class="pareto-selection" role="status">{{ selected ? `已选：${selected.description}` : '尚未选择类别' }}</p>
      </div>
    </DemoBlock>
    <h2>什么时候不该用它</h2>
    <ul>
      <li>需要判断因果关系时不用：累计占比只说明数量构成。</li>
      <li>需要表达时间趋势时用折线图，不按数量重排时间。</li>
      <li>需要解释正负贡献对总量的影响时用瀑布图，不排除负值后伪装完整结论。</li>
    </ul>
    <h2>模型与交互</h2>
    <p>用 buildPareto 生成 model，传入 title、selectedId 和 height；select 返回稳定类别 ID。各端接收同一个可序列化模型，因此排序、分母、累计值和源行映射保持一致。小程序事件的 ID 位于 detail.id，Flutter 使用 onSelect 回调。</p>
    <p>阈值须大于 0 且不超过 1；默认 0.8。重复 ID、非法阈值或合计溢出会返回无效状态，缺失、负数或非有限数逐项列为排除项。全零保留数据清单，累计占比显示为无定义。</p>
  </article>
</template>

<style scoped>
.pareto-demo { width: 100%; min-width: 0; }
.pareto-page p { max-width: 45em; }
.pareto-controls { display: flex; flex-wrap: wrap; gap: var(--i-spacing-2); margin-bottom: var(--i-spacing-4); }
.pareto-selection { margin-top: var(--i-spacing-3); color: var(--i-color-text-secondary); }
</style>
