<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChartGantt.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  daysBetween,
  ganttBars,
  ganttCycle,
  ganttDomain,
  ganttLinks,
  ganttTicks,
  ganttTodayX,
  type GanttTask
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    tasks: GanttTask[]
    title?: string
    /** 一天占多少像素。周期长的排期调小它，一屏就能看全 */
    dayWidth?: number
    rowHeight?: number
    /** 覆盖「今天」，主要用于文档与测试里让截图稳定 */
    today?: string
  }>(),
  { title: '', dayWidth: 18, rowHeight: 34, today: '' }
)

const NAME_W = 132
const HEADER_H = 28
const BAR_H = 18

const today = computed(() => props.today || new Date().toISOString().slice(0, 10))
const domain = computed(() => ganttDomain(props.tasks))
const bars = computed(() =>
  ganttBars(props.tasks, domain.value, {
    dayWidth: props.dayWidth,
    rowHeight: props.rowHeight,
    barHeight: BAR_H,
    today: today.value
  })
)
const links = computed(() => ganttLinks(bars.value))
const ticks = computed(() => ganttTicks(domain.value, props.dayWidth, today.value))
const todayX = computed(() => ganttTodayX(domain.value, props.dayWidth, today.value))

/*
 * 依赖成环时不画依赖线。
 * 成环的排期画出来是一团互相指的箭头，看图的人只会以为是渲染坏了——
 * 与其画一张读不出结论的图，不如明说是数据本身有环。
 */
const cycle = computed(() => ganttCycle(props.tasks))

const chartW = computed(() => domain.value.days * props.dayWidth)
const chartH = computed(() => props.tasks.length * props.rowHeight)

const active = ref(-1)
const showTable = ref(false)

const span = (t: GanttTask) => (t.milestone ? 0 : daysBetween(t.start, t.end) + 1)
const percent = (v?: number) => `${Math.round((v ?? 0) * 100)}%`
</script>

<template>
  <figure class="i-chart i-gantt">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>

    <p v-if="cycle.length" class="i-gantt__warn" role="status">
      <!-- 图标 + 文字，颜色不是唯一线索 -->
      <span class="i-gantt__warn-icon" aria-hidden="true">!</span>
      任务 {{ cycle.join(' → ') }} 的依赖构成了环，已不画依赖线
    </p>

    <div class="i-gantt__frame">
      <!-- 任务名固定在左侧，横向滚动时不跟着走：滚出去之后就对不上是哪一行了 -->
      <div class="i-gantt__names" :style="{ width: `${NAME_W}px` }">
        <div class="i-gantt__names-head" :style="{ height: `${HEADER_H}px` }">任务</div>
        <div
          v-for="(task, i) in tasks"
          :key="task.id"
          class="i-gantt__name"
          :class="{ 'is-active': active === i }"
          :style="{ height: `${rowHeight}px` }"
          @mouseenter="active = i"
          @mouseleave="active = -1"
        >
          {{ task.name }}
        </div>
      </div>

      <div class="i-gantt__scroll">
        <svg
          class="i-gantt__svg"
          :width="chartW"
          :height="chartH + HEADER_H"
          :viewBox="`0 0 ${chartW} ${chartH + HEADER_H}`"
          role="img"
          :aria-label="title || '甘特图'"
          @mouseleave="active = -1"
        >
          <!-- 周分隔线在最底层，压不住任何数据 -->
          <g>
            <line
              v-for="tick in ticks"
              :key="tick.iso"
              class="i-chart__grid"
              :x1="tick.x"
              :x2="tick.x"
              y1="0"
              :y2="chartH + HEADER_H"
            />
            <text
              v-for="tick in ticks"
              :key="`t-${tick.iso}`"
              class="i-chart__tick"
              :class="{ 'is-current': tick.current }"
              :x="tick.x + 4"
              :y="18"
            >
              {{ tick.label }}
            </text>
          </g>

          <!-- 今天：一条竖线，位置本身就是信息，不需要文字标注 -->
          <line
            v-if="todayX >= 0"
            class="i-gantt__today"
            :x1="todayX"
            :x2="todayX"
            :y1="HEADER_H"
            :y2="chartH + HEADER_H"
          />

          <!-- 依赖线走折线：直线会斜穿过中间几行的横条，读者分不清连的是哪两根 -->
          <polyline
            v-for="link in cycle.length ? [] : links"
            :key="link.id"
            class="i-gantt__link"
            :points="link.points.map((v, i) => (i % 2 ? v + HEADER_H : v)).join(',')"
          />

          <g
            v-for="(bar, i) in bars"
            :key="bar.id"
            class="i-gantt__bar"
            :class="{ 'is-active': active === i, 'is-overdue': bar.overdue }"
            @mouseenter="active = i"
          >
            <!-- 里程碑是零工期的时点，画成菱形：画成一根一天宽的横条会被当成一天的工作量 -->
            <polygon
              v-if="bar.milestone"
              class="i-gantt__milestone"
              :points="`${bar.x},${bar.y + HEADER_H + BAR_H / 2 - 8} ${bar.x + 8},${bar.y + HEADER_H + BAR_H / 2} ${bar.x},${bar.y + HEADER_H + BAR_H / 2 + 8} ${bar.x - 8},${bar.y + HEADER_H + BAR_H / 2}`"
            />
            <template v-else>
              <rect
                class="i-gantt__track"
                :x="bar.x"
                :y="bar.y + HEADER_H"
                :width="bar.width"
                :height="BAR_H"
                rx="3"
              />
              <!-- 进度层叠在轨道上，同色更深；只用长度表示完成度，不另起一种颜色 -->
              <rect
                v-if="bar.progressWidth > 0"
                class="i-gantt__progress"
                :x="bar.x"
                :y="bar.y + HEADER_H"
                :width="bar.progressWidth"
                :height="BAR_H"
                rx="3"
              />
            </template>
            <title>{{ bar.name }}：{{ bar.start }} → {{ bar.end }}，完成 {{ percent(bar.progress) }}</title>
          </g>
        </svg>
      </div>
    </div>

    <div class="i-chart__legend">
      <span class="i-chart__legend-item"><span class="i-gantt__swatch is-track" />计划</span>
      <span class="i-chart__legend-item"><span class="i-gantt__swatch is-progress" />已完成</span>
      <span class="i-chart__legend-item"><span class="i-gantt__swatch is-overdue" />已逾期</span>
      <span class="i-chart__legend-item"><span class="i-gantt__swatch is-milestone" />里程碑</span>
    </div>

    <button class="i-chart__table-toggle" @click="showTable = !showTable">
      {{ showTable ? '收起数据表' : '查看数据表' }}
    </button>
    <table v-if="showTable" class="i-chart__table">
      <thead>
        <tr><th>任务</th><th>开始</th><th>结束</th><th>工期</th><th>完成</th><th>状态</th></tr>
      </thead>
      <tbody>
        <tr v-for="(task, i) in tasks" :key="task.id">
          <td>{{ task.name }}</td>
          <td>{{ task.start }}</td>
          <td>{{ task.end }}</td>
          <td>{{ task.milestone ? '里程碑' : `${span(task)} 天` }}</td>
          <td>{{ percent(task.progress) }}</td>
          <td>{{ bars[i]?.overdue ? '已逾期' : '正常' }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
