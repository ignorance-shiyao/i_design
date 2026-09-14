<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChartFrame.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 图的外框：标题、口径、图例、状态与出口。
 *
 * 「出口」是这个组件存在的主要理由：每张图都要有一条不看图也能拿到数的路。
 * 读屏用户读不了 SVG，色觉障碍用户分不清相邻两个系列，而任何人想把数抄进
 * 邮件时都需要表格。表格与图同源——都从 toSeries 出来，各算一遍的实现
 * 迟早会在某次改口径时只改一边，而对不上的两个数字比没有表格更糟。
 *
 * 数据质量也在这里说：缺失、负值、全零、混单位不该由读者自己看出来。
 */
import { computed, ref } from 'vue'
import {
  chartSummary, dataIssues, issueText, toCsv, toTable,
  type ChartDataset, type ChartSpec
} from '@i-design/common'
import IButton from './IButton.vue'
import IIcon from './IIcon.vue'
import IPageState from './IPageState.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    /** 统计口径。同一张图换个口径就是另一回事，而读者无从分辨，除非写出来 */
    note?: string
    dataset?: ChartDataset | null
    spec?: ChartSpec | null
    loading?: boolean
    error?: { code?: number | string; message?: string } | null
    /** 下载的文件名，不含扩展名 */
    fileName?: string
  }>(),
  {
    title: '', subtitle: '', note: '', dataset: null, spec: null,
    loading: false, error: null, fileName: 'chart'
  }
)

const table = computed(() =>
  props.dataset && props.spec ? toTable(props.dataset, props.spec) : { header: [], rows: [] }
)
const issues = computed(() =>
  props.dataset && props.spec ? dataIssues(props.dataset, props.spec) : []
)
const summary = computed(() =>
  props.dataset && props.spec ? chartSummary(props.dataset, props.spec) : ''
)

const showTable = ref(false)

function download() {
  const csv = toCsv(table.value)
  // BOM：不加的话 Excel 打开中文列名是乱码，而这是最常见的去处
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${props.fileName}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <figure class="i-chart-frame">
    <figcaption class="i-chart-frame__head">
      <div class="i-chart-frame__titles">
        <h3 v-if="title" class="i-chart-frame__title">{{ title }}</h3>
        <p v-if="subtitle" class="i-chart-frame__subtitle">{{ subtitle }}</p>
      </div>
      <div class="i-chart-frame__actions">
        <slot name="actions" />
        <IButton
          variant="text"
          size="sm"
          :aria-expanded="String(showTable)"
          @click="showTable = !showTable"
        >
          <IIcon name="grid" :size="14" />
          {{ showTable ? '看图' : '看数据' }}
        </IButton>
        <IButton variant="text" size="sm" :disabled="!table.rows.length" @click="download">
          <IIcon name="download" :size="14" />
          下载 CSV
        </IButton>
      </div>
    </figcaption>

    <IPageState
      :loading="loading"
      :error="error"
      :loaded="table.rows.length"
      empty-type="empty"
      @action="$emit('retry')"
    >
      <!--
        图本身由调用方给：这个组件不认识任何一种图。

        摘要写成一段对读屏可见、视觉上隐藏的文字，而不是给容器挂 role="img"：
        role="img" 会把整棵子树当成一张图，里面的图例按钮就成了嵌套交互
        （axe 的 nested-interactive 实测报过），而且读屏用户也就点不到图例了。
      -->
      <div v-show="!showTable" class="i-chart-frame__canvas">
        <p class="i-chart-frame__summary">{{ summary }}</p>
        <slot />
      </div>

      <!-- 表格出口：与图同源，缺失值显示「—」而不是 0 -->
      <div v-show="showTable" class="i-chart-frame__table-wrap">
        <table class="i-chart-frame__table">
          <caption class="i-chart-frame__caption">{{ title || '数据表' }}</caption>
          <thead>
            <tr><th v-for="head in table.header" :key="head" scope="col">{{ head }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in table.rows" :key="index">
              <template v-for="(cell, column) in row" :key="column">
                <th v-if="column === 0" scope="row">{{ cell }}</th>
                <td v-else :class="{ 'is-missing': cell === null }">{{ cell === null ? '—' : cell }}</td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </IPageState>

    <p v-if="note" class="i-chart-frame__note">口径：{{ note }}</p>

    <!-- 数据本身的问题单独说，不混进口径 -->
    <ul v-if="issues.length" class="i-chart-frame__issues">
      <li v-for="(issue, index) in issues" :key="index">
        <IIcon name="info-circle" :size="12" />
        {{ issueText(issue) }}
      </li>
    </ul>
  </figure>
</template>
