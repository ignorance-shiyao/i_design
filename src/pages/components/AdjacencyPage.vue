<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  buildAdjacency,
  type AdjacencyEdgeInput,
  type AdjacencyNodeInput,
  type AdjacencySort
} from '@i-design/common'
import IChartAdjacency from '@/components/IChartAdjacency.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const selectedRow = ref<number | null>(null)
const selectedCol = ref<number | null>(null)
const sort = ref<AdjacencySort>('input')
const demo = ref<'mixed' | 'directed' | 'empty'>('mixed')

/*
 * 演示要演出三件事：
 * 1. 甲→乙 有权边；甲→丙 零权边（是 0，不是空档）
 * 2. 乙→丁 未观测（不是 0）
 * 3. 其余空档是确认没边（也不是 0）
 * 排序切换要能看出行列在动，但格子里的语义不变。
 */
const nodes: AdjacencyNodeInput[] = [
  { id: 'a', label: '甲', community: '东' },
  { id: 'b', label: '乙', community: '东' },
  { id: 'c', label: '丙', community: '西' },
  { id: 'd', label: '丁' }
]

const mixedEdges: AdjacencyEdgeInput[] = [
  { from: 'a', to: 'b', weight: 3 },
  { from: 'a', to: 'c', weight: 0 },
  { from: 'b', to: 'd', unknown: true }
]

const directedEdges: AdjacencyEdgeInput[] = [
  { from: 'a', to: 'b', weight: 5 },
  { from: 'b', to: 'c', weight: 2 },
  { from: 'c', to: 'a', weight: null }
]

const model = computed(() => {
  if (demo.value === 'empty') {
    return buildAdjacency([], [], { sort: sort.value })
  }
  return buildAdjacency(nodes, demo.value === 'directed' ? directedEdges : mixedEdges, {
    sort: sort.value,
    directed: demo.value === 'directed',
    unit: ''
  })
})

const selected = computed(() => {
  if (selectedRow.value === null || selectedCol.value === null) return null
  return model.value.cells[selectedRow.value]?.[selectedCol.value] ?? null
})

function pick(row: number, col: number) {
  selectedRow.value = row
  selectedCol.value = col
}

function changeDemo(value: 'mixed' | 'directed' | 'empty') {
  demo.value = value
  selectedRow.value = null
  selectedCol.value = null
}

function changeSort(value: AdjacencySort) {
  sort.value = value
  selectedRow.value = null
  selectedCol.value = null
}
</script>

<template>
  <article class="doc-page adjacency-page">
    <header class="doc-page__header">
      <h1>邻接矩阵</h1>
      <p>
        谁连着谁、连得有多重。空格子要分清「没有边」和「没统计到」——两者都不是 0；权重为 0 的边才会画成 0。排序口径写在共享逻辑里，各端不得私自重排。
      </p>
    </header>

    <DemoBlock title="三种空位、三种排序">
      <p>
        切换排序只会改行列次序，不会把空档变成 0。有向示例里丙→甲是「未观测」，甲→丙仍是空档——方向反了不是一回事。
      </p>
      <div class="adjacency-demo">
        <div class="adjacency-controls" aria-label="示例数据状态">
          <IButton :aria-pressed="demo === 'mixed'" @click="changeDemo('mixed')">无向混合</IButton>
          <IButton :aria-pressed="demo === 'directed'" @click="changeDemo('directed')">有向</IButton>
          <IButton :aria-pressed="demo === 'empty'" @click="changeDemo('empty')">空数据</IButton>
        </div>
        <div class="adjacency-controls" aria-label="排序口径">
          <IButton :aria-pressed="sort === 'input'" @click="changeSort('input')">输入序</IButton>
          <IButton :aria-pressed="sort === 'degree'" @click="changeSort('degree')">按度数</IButton>
          <IButton :aria-pressed="sort === 'community'" @click="changeSort('community')">按社群</IButton>
        </div>
        <IChartAdjacency
          :model="model"
          :selected-row="selectedRow"
          :selected-col="selectedCol"
          @select="pick"
        />
        <p class="adjacency-selection" role="status">
          {{ selected ? `已选：${selected.description}` : '点格子看读法。' }}
        </p>
      </div>
    </DemoBlock>

    <section class="doc-page__section">
      <h2>口径</h2>
      <ul>
        <li>空格分两种：<strong>无边</strong>（absent）与<strong>未观测</strong>（unknown），值都是 null，画成「—」。</li>
        <li><strong>0</strong> 只表示权重为零的边（ready 且值为 0），必须能和空格分开。</li>
        <li>排序必须显式选择：输入序 / 度数 / 社群。模型上的 basis 要画在图上。</li>
        <li>无向图 (i,j) 与 (j,i) 同值；有向图不镜像。对角线默认无边，除非显式自环。</li>
      </ul>
    </section>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>只想看谁连着谁、不关心权重时用关系图：矩阵的价值在格子里的数，不是点线好看。</li>
      <li>节点多到几十个以上时慎用：格子会细到读不出、点不中，先筛社群或改用可搜索的边表。</li>
      <li>边几乎全是「未观测」时不要硬画：满屏破折号说明数据还没到，先补采集再谈矩阵。</li>
    </ul>

    <h2>模型与交互</h2>
    <p>
      用 buildAdjacency 生成 model，传入节点、边与 sort / directed；select 返回行列下标。各端接收同一个可序列化模型，空档与零权边的区分、排序与对称规则都来自共享逻辑。
    </p>
  </article>
</template>

<style scoped>
.adjacency-demo { width: 100%; min-width: 0; }
.adjacency-page p,
.adjacency-page li { max-width: 45em; }
.adjacency-controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-2);
  margin-bottom: var(--i-spacing-3);
}
.adjacency-selection {
  margin-top: var(--i-spacing-3);
  color: var(--i-color-text-secondary);
}
</style>
