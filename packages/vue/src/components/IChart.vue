<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChart.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { useConfig } from './useConfig'
import { useChartWidth } from './useChartWidth'
import { computed, ref } from 'vue'
import {
  areaPath,
  bandPath,
  domainOf,
  formatTick,
  linePath,
  percentStack,
  stepPath,
  targetProgress,
  niceTicks,
  scaleX,
  scaleY,
  type ChartSeries,
  type ChartThreshold,
  labelStep,
  showLabelAt,
  barRect,
  categoryBands,
  dualAxis,
  rankOrder,
  valueAxis
} from '@i-design/common'

/* 文案走字典：图表的数据表是它的无障碍出口，按钮与表头也得跟着换语言 */
const { locale } = useConfig()

const props = withDefaults(
  defineProps<{
    /** 每个系列一条线／一组柱；系列顺序即取色顺序 */
    series: ChartSeries[]
    /** x 轴标签，与 data 一一对应 */
    labels: string[]
    /**
     * 是否自带「数据表 / 导出」出口。
     *
     * 外面套了 IChartFrame 时要关掉：那一层的出口是按数据集出的，
     * 对所有图型都有；两个出口并排摆着，读者只会疑惑该点哪一个。
     */
    exits?: boolean
    type?: 'line' | 'area' | 'bar'
    /**
     * 百分比堆叠：每一列换算成占比。
     *
     * 分母有两种情况不换算并在图注里说明：整列为 0（没有分母）、
     * 列里有负数（「占总量的百分之多少」这句话本身不成立）。
     */
    percent?: boolean
    /**
     * 折线的画法。step 适合「值在两次采样之间保持不变」的量——
     * 库存、在线人数、档位。用折线画会让读者以为中间在连续变化。
     */
    curve?: 'linear' | 'step'
    /** 目标线：要达到的值。与阈值分开——把目标画成危险色会让它看起来像故障 */
    target?: { value: number; label?: string } | null
    /** 柱状图专用：堆叠而不是并排 */
    stacked?: boolean
    /**
     * 柱状图的方向。horizontal 把值轴放到水平方向、类目轴放到垂直方向。
     *
     * 类目名一长，纵向柱的标签只能斜排或者隔一个显示，两种都要读者费劲；
     * 横条的标签是一行行正着写的，长名字也读得下去。其它图型忽略这个属性——
     * 折线横过来读者会把「时间」读成「量」。
     */
    orientation?: 'vertical' | 'horizontal'
    /**
     * 横条按值排序。横条多数时候是排名，乱序的话读者会自己去找最长的那根；
     * 但如果类目本身有顺序（星期、档位），排序反而破坏信息，所以不是默认。
     */
    rank?: 'desc' | 'asc' | 'none'
    height?: number
    /** 折线是否从零起。柱状图恒从零起——不从零会放大差异，是最常见的误导 */
    fromZero?: boolean
    /** 末点直接标注数值，省掉「看图例再找线」这一步 */
    labelLast?: boolean
    title?: string
    /** 数值单位，出现在提示框里 */
    unit?: string
    /**
     * 第二值轴：把两种单位的量画在一张图里。
     *
     * 只对折线生效。双轴是最容易骗人的图型——两条线谁在上、在哪儿交叉，
     * 全由两侧刻度的取值决定，换一组刻度就能把结论反过来。所以这里要求
     * 两侧都写明单位，并把「不该用双轴」的情形（两侧单位相同、有系列没归属、
     * 零位对不齐）直接印在图下，而不是让读者自己看出来。
     *
     * 柱状与面积不支持：那需要每个系列各自的图型（柱 + 线），
     * 是另一件事，不在这里假装支持。
     */
    axes?: {
      left: { series: string[]; unit: string; label?: string }
      right: { series: string[]; unit: string; label?: string }
    } | null
    /**
     * 阈值线与阈值带：把「多少算正常」画进图里。
     *
     * 没有它，读者只能看出趋势，看不出「现在是不是超了」——
     * 而后者往往才是看这张图的原因。value 是一条线，from/to 是一条带。
     */
    thresholds?: ChartThreshold[]
  }>(),
  {
    type: 'line',
    exits: true,
    percent: false,
    curve: 'linear',
    target: null,
    stacked: false,
    orientation: 'vertical',
    rank: 'none',
    height: 240,
    fromZero: true,
    labelLast: true,
    title: '',
    unit: '',
    thresholds: () => [],
    axes: null
  }
)

/*
 * 视图宽度跟着容器走（见 useChartWidth）：固定 640 时，这张图在手机上会被整体
 * 缩到 0.48，11px 的刻度字实际只剩 6px，而标签抽稀还按 640 的密度排——缩完糊成
 * 一条黑边。对齐容器宽度之后，缩放比回到 1，字是几号就是几号。
 */
const root = ref<HTMLElement | null>(null)
const W = useChartWidth(root)
// 右侧留白按是否直接标注决定：标注是文字，挤在边缘会被裁掉
const PAD = computed(() => ({
  top: 16,
  // 双轴要在右边写刻度与单位，末点标注就让位——两样都塞进去会互相压住
  right: props.axes && props.type === 'line' ? 56 : props.labelLast && props.type !== 'bar' ? 96 : 16,
  bottom: 28,
  // 横条的类目名写在左边，48px 只够放数字刻度
  left: props.type === 'bar' && props.orientation === 'horizontal' ? 110 : 48
}))
const plotW = computed(() => W.value - PAD.value.left - PAD.value.right)
const plotH = computed(() => props.height - PAD.value.top - PAD.value.bottom)

/** 被图例关掉的系列：只影响显示，不改传入的数据 */
/*
 * 轴标签抽稀：标签一多就会互相压住，糊成一条黑边——那既读不出内容，
 * 也让人误以为轴上有一根粗线。按可用宽度算出每隔几个画一个。
 */
const tickStep = computed(() => labelStep(props.labels.length, plotW.value))

const hidden = ref<Set<string>>(new Set())

function toggle(name: string) {
  const next = new Set(hidden.value)
  // 不允许关掉最后一个系列：空图表没有信息量，只会让人以为坏了
  if (next.has(name)) next.delete(name)
  else if (props.series.length - next.size > 1) next.add(name)
  hidden.value = next
}
const rawVisible = computed(() => props.series.filter((s) => !hidden.value.has(s.name)))

/* 百分比堆叠在这里换算：换算不了的列原样保留，并由 percentSkipped 报出来 */
const percentResult = computed(() =>
  props.percent ? percentStack(rawVisible.value) : { series: rawVisible.value, skipped: [] }
)
const visible = computed(() => percentResult.value.series)
const percentSkipped = computed(() => percentResult.value.skipped)

/** 目标达成情况，供图注与读屏用 */
const target = computed(() =>
  props.target ? targetProgress(visible.value, props.target.value) : null
)

const isBar = computed(() => props.type === 'bar')
const stacked = computed(() => isBar.value && props.stacked)

/*
 * 多系列面积图按堆叠画：几层半透明面积叠在一起会混成一片说不清的颜色，
 * 而且读者无法判断某一层到底有多高。堆叠后每层的厚度就是它自己的值。
 */
const stackedArea = computed(() => props.type === 'area' && visible.value.length > 1)

const domain = computed(() =>
  domainOf(visible.value.length ? visible.value : props.series, {
    // 柱状图恒从零起：柱长本身就是数值，截断基线等于篡改数值
    fromZero: isBar.value ? true : props.fromZero,
    stacked: stacked.value || stackedArea.value
  })
)

/** 堆叠面积每层的累计值（上沿）与它下面一层的累计值（下沿） */
const areaSeries = computed(() =>
  visible.value.map((s, si) => {
    const below = (i: number) =>
      visible.value.slice(0, si).reduce((sum, o) => sum + (o.data[i] ?? 0), 0)
    return {
      name: s.name,
      data: stackedArea.value ? s.data.map((v, i) => v + below(i)) : s.data,
      base: stackedArea.value ? s.data.map((_, i) => below(i)) : s.data.map(() => Math.max(0, scale.value.min))
    }
  })
)
const ticks = computed(() => niceTicks(domain.value.min, domain.value.max, 5))
const scale = computed(() => ({ min: ticks.value[0], max: ticks.value[ticks.value.length - 1] }))

const colorOf = (name: string) => {
  const index = props.series.findIndex((s) => s.name === name)
  return `var(--i-chart-${(index % 8) + 1})`
}

const y = (v: number) => scaleY(v, scale.value.min, scale.value.max, plotH.value) + PAD.value.top
const x = (i: number) => scaleX(i, props.labels.length, plotW.value) + PAD.value.left

/**
 * 末点标注的纵向位置：先按数据点算，再把靠得太近的两条错开。
 * 两个系列在末尾接近时，直接按数据点放会把两行字叠在一起。
 */
const endLabels = computed(() => {
  const rows = visible.value.map((s, si) => {
    const raw = s.data[s.data.length - 1] ?? 0
    // 堆叠面积里线画在累计值上，标记必须跟着线走；
    // 但展示的仍是这个系列自己的值——读者要的是「它是多少」，不是「累计到多少」
    const plotted = stackedArea.value
      ? areaSeries.value[si].data[areaSeries.value[si].data.length - 1] ?? 0
      : raw
    return { name: s.name, value: raw, plotted, y: y(plotted) }
  })
  rows.sort((a, b) => a.y - b.y)
  const MIN_GAP = 15
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].y - rows[i - 1].y < MIN_GAP) rows[i].y = rows[i - 1].y + MIN_GAP
  }
  return rows
})

/* ---------- 柱状 ---------- */
const bandWidth = computed(() => plotW.value / Math.max(1, props.labels.length))
const barWidth = computed(() =>
  stacked.value ? bandWidth.value * 0.5 : (bandWidth.value * 0.62) / Math.max(1, visible.value.length)
)

function barX(seriesIndex: number, i: number) {
  const bandStart = PAD.value.left + bandWidth.value * i
  if (stacked.value) return bandStart + (bandWidth.value - barWidth.value) / 2
  const groupWidth = barWidth.value * visible.value.length
  return bandStart + (bandWidth.value - groupWidth) / 2 + seriesIndex * barWidth.value
}

/** 堆叠时每段的起点是它下面所有段的和 */
function stackBase(i: number, seriesIndex: number) {
  return visible.value.slice(0, seriesIndex).reduce((sum, s) => sum + (s.data[i] ?? 0), 0)
}

/* ---------- 双轴 ----------
 * 判定与布局都在 @i-design/common 的 dualAxis 里，五端同一份：
 * 哪些情形不该用双轴，不该由各端各写一遍。
 */
const dual = computed(() => {
  if (!props.axes || props.type !== 'line') return null
  const indexOf = (names: string[]) =>
    names.map((n) => visible.value.findIndex((s) => s.name === n)).filter((i) => i >= 0)
  return dualAxis(
    visible.value,
    { series: indexOf(props.axes.left.series), unit: props.axes.left.unit, label: props.axes.left.label },
    { series: indexOf(props.axes.right.series), unit: props.axes.right.unit, label: props.axes.right.label },
    plotH.value,
    { format: formatTick }
  )
})

/** 双轴被忽略时要明说：折线以外的图型不支持 */
const dualIgnored = computed(() => !!props.axes && props.type !== 'line')

/** 某个系列归哪一侧——右侧名单里没有的都按左轴画 */
const onRight = (name: string) => !!props.axes && props.axes.right.series.includes(name)
const axisFor = (name: string) =>
  dual.value ? (onRight(name) ? dual.value.right : dual.value.left) : null

/** 双轴下每个系列用自己那一侧的刻度，这正是它能骗人的地方，所以单位必须写在轴上 */
const yIn = (name: string, value: number) => {
  const axis = axisFor(name)
  if (!axis) return y(value)
  return scaleY(value, axis.min, axis.max, plotH.value) + PAD.value.top
}

/* ---------- 横条 ----------
 * 轴系走 @i-design/common 的 axis：横纵两个方向共用同一套刻度与类目带，
 * 两端各写一套的话，刻度密度一定会一个疏一个密。
 */
const horizontal = computed(() => isBar.value && props.orientation === 'horizontal')

/** 横条的值轴：值向右增长，与像素同向 */
const hAxis = computed(() =>
  valueAxis(domain.value.min, domain.value.max, plotW.value, 'horizontal', { format: formatTick })
)

/** 类目带铺在垂直方向 */
const hBands = computed(() => categoryBands(props.labels.length, plotH.value))

/** 排名顺序：只改画的顺序与标签顺序，不动传入的数据 */
const hOrder = computed(() => {
  const totals = props.labels.map((_, i) =>
    visible.value.reduce((sum, s) => sum + (s.data[i] ?? 0), 0)
  )
  return rankOrder(totals, props.rank)
})

const hThickness = computed(() => {
  const size = hBands.value[0]?.size ?? 0
  return stacked.value ? size * 0.5 : (size * 0.62) / Math.max(1, visible.value.length)
})

const hx = (value: number) => {
  const { min, max } = hAxis.value
  return PAD.value.left + ((value - min) / (max - min || 1)) * plotW.value
}

/** 每根横条的矩形：负值从基线往左长，圆角换到左端 */
const hBars = computed(() =>
  visible.value.flatMap((s, si) =>
    hOrder.value.map((dataIndex, row) => {
      const band = hBands.value[row]
      const value = s.data[dataIndex] ?? 0
      const base = stacked.value ? stackBase(dataIndex, si) : 0
      const offsetInBand = stacked.value
        ? (band.size - hThickness.value) / 2
        : (band.size - hThickness.value * visible.value.length) / 2 + si * hThickness.value
      const rect = barRect(
        { band, thickness: hThickness.value, offsetInBand },
        { from: hx(base), to: hx(base + value) },
        'horizontal'
      )
      return {
        key: `${s.name}-${dataIndex}`,
        name: s.name,
        dataIndex,
        x: rect.x,
        y: rect.y + PAD.value.top,
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
        // 堆叠时只有最外面一段收圆角：中间段也圆会看起来像一颗颗独立的胶囊
        rounded: !stacked.value || si === visible.value.length - 1
      }
    })
  )
)

/* ---------- 悬停 ---------- */
const active = ref<number | null>(null)

function onMove(event: MouseEvent) {
  const rect = root.value?.getBoundingClientRect()
  if (!rect || !props.labels.length) return
  if (horizontal.value) {
    // 横条的命中走垂直方向；而且落在第几条带上要按排序后的顺序反查回数据下标
    const row = Math.floor(
      (((event.clientY - rect.top) / rect.height) * props.height - PAD.value.top) /
        Math.max(1, hBands.value[0]?.size ?? 1)
    )
    const clamped = Math.min(props.labels.length - 1, Math.max(0, row))
    active.value = hOrder.value[clamped] ?? null
    return
  }
  const ratio = (event.clientX - rect.left) / rect.width
  const px = ratio * W.value
  // 取最近的数据点，而不是要求指针精确落在点上——命中区域要比标记大
  const step = isBar.value ? bandWidth.value : plotW.value / Math.max(1, props.labels.length - 1)
  const index = Math.round((px - PAD.value.left - (isBar.value ? bandWidth.value / 2 : 0)) / step)
  active.value = Math.min(props.labels.length - 1, Math.max(0, index))
}

const tooltipStyle = computed(() => {
  if (active.value === null) return {}
  if (horizontal.value) {
    const row = hOrder.value.indexOf(active.value)
    const band = hBands.value[row]
    return {
      left: `${((PAD.value.left + plotW.value / 2) / W.value) * 100}%`,
      top: `${(((band ? PAD.value.top + band.center : PAD.value.top) - 8) / props.height) * 100}%`
    }
  }
  const px = isBar.value ? PAD.value.left + bandWidth.value * (active.value + 0.5) : x(active.value)
  return { left: `${(px / W.value) * 100}%`, top: `${(y(scale.value.max) / props.height) * 100}%` }
})

/*
 * 阈值只有落在当前值域里才画得出来。
 * 超出值域的阈值静默丢弃——把它硬压到边缘会让读者误以为「刚好卡在临界」。
 */
/*
 * 阈值目前只画在纵向上：横条的阈值是一条竖线，与「排名」这个读法冲突
 * （读者会把竖线当成分隔栏）。没实现就明说，不静默丢掉。
 */
const thresholdsDropped = computed(() => horizontal.value && props.thresholds.length > 0)

const marks = computed(() =>
  horizontal.value ? [] : props.thresholds
    .filter((t) => t.value === undefined || (t.value >= scale.value.min && t.value <= scale.value.max))
    .map((t) => {
      const status = t.status ?? 'warning'
      if (t.value !== undefined) {
        return { kind: 'line' as const, status, label: t.label ?? '', y: y(t.value), height: 0 }
      }
      const from = Math.max(scale.value.min, t.from ?? scale.value.min)
      const to = Math.min(scale.value.max, t.to ?? scale.value.max)
      return {
        kind: 'band' as const,
        status,
        label: t.label ?? '',
        y: y(to),
        height: Math.max(0, y(from) - y(to))
      }
    })
)

const showTable = ref(false)

/**
 * 导出 CSV：数据表解决了「读屏能读到」，导出解决了「拿去自己算」。
 * 两者都不该逼读者回去找数据源。
 */
function exportCsv() {
  const head = [props.title || locale.value.chartCategory, ...props.series.map((s) => s.name)]
  const rows = props.labels.map((label, i) => [label, ...props.series.map((s) => String(s.data[i] ?? ''))])
  // 字段里可能有逗号或引号，按 RFC 4180 转义，否则列会串位
  const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const csv = [head, ...rows].map((r) => r.map(cell).join(',')).join('\n')
  // BOM：没有它 Excel 会把中文表头认成乱码
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.title || 'chart'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <figure class="i-chart" ref="root">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>

    <svg
      class="i-chart__svg"
      :viewBox="`0 0 ${W} ${height}`"
      :style="{ height: `${height}px` }"
      role="img"
      :aria-label="title || '图表'"
      @mousemove="onMove"
      @mouseleave="active = null"
    >
      <!-- 网格与刻度：背景信息，最淡的一档 -->
      <g v-if="!horizontal">
        <template v-for="tick in ticks" :key="tick">
          <line class="i-chart__grid" :x1="PAD.left" :x2="W - PAD.right" :y1="y(tick)" :y2="y(tick)" />
          <text class="i-chart__tick" :x="PAD.left - 8" :y="y(tick) + 4" text-anchor="end">
            {{ formatTick(tick) }}
          </text>
        </template>
        <line
          class="i-chart__axis"
          :x1="PAD.left"
          :x2="W - PAD.right"
          :y1="y(Math.max(scale.min, 0))"
          :y2="y(Math.max(scale.min, 0))"
        />
      </g>

      <!--
        横条的网格与刻度：网格竖着画、刻度写在下沿。
        密度与纵向同源（valueAxis 用的是同一套 niceTicks），
        不然同一份数据横过来读者会觉得「怎么刻度变了」。
      -->
      <g v-else>
        <template v-for="tick in hAxis.ticks" :key="`h-${tick.value}`">
          <line
            class="i-chart__grid"
            :x1="PAD.left + tick.offset"
            :x2="PAD.left + tick.offset"
            :y1="PAD.top"
            :y2="PAD.top + plotH"
          />
          <text class="i-chart__tick" :x="PAD.left + tick.offset" :y="height - 8" text-anchor="middle">
            {{ tick.label }}
          </text>
        </template>
        <line
          class="i-chart__axis"
          :x1="PAD.left + hAxis.baseline"
          :x2="PAD.left + hAxis.baseline"
          :y1="PAD.top"
          :y2="PAD.top + plotH"
        />
        <!-- 类目名正着写在左边，长名字也读得下去——这正是横条存在的理由 -->
        <text
          v-for="(row, i) in hOrder"
          :key="`h-label-${row}`"
          class="i-chart__tick"
          :x="PAD.left - 10"
          :y="PAD.top + hBands[i].center + 4"
          text-anchor="end"
        >
          {{ labels[row] }}
        </text>
      </g>

      <!-- 右轴：刻度写在右边，单位跟着轴走——双轴图里「这条线是什么量」只能靠它 -->
      <g v-if="dual">
        <text
          v-for="tick in dual.right.ticks"
          :key="`right-${tick.value}`"
          class="i-chart__tick"
          :x="W - PAD.right + 8"
          :y="tick.offset + PAD.top + 4"
          text-anchor="start"
        >
          {{ tick.label }}
        </text>
        <text class="i-chart__tick" :x="W - PAD.right + 8" :y="PAD.top - 4" text-anchor="start">
          {{ axes?.right.label || axes?.right.unit }}
        </text>
        <text class="i-chart__tick" :x="PAD.left - 8" :y="PAD.top - 4" text-anchor="end">
          {{ axes?.left.label || axes?.left.unit }}
        </text>
      </g>

      <!--
        阈值画在网格之上、数据之下：它是参考背景，不该盖住数据本身。
        带用低不透明度填充，线用虚线——实线会被误读成又一个数据系列。
      -->
      <g v-if="marks.length">
        <template v-for="(mark, mi) in marks" :key="`mark-${mi}`">
          <rect
            v-if="mark.kind === 'band'"
            class="i-chart__mark-area"
            :class="`is-${mark.status}`"
            :x="PAD.left"
            :y="mark.y"
            :width="plotW"
            :height="mark.height"
          />
          <line
            v-else
            class="i-chart__mark-line"
            :class="`is-${mark.status}`"
            :x1="PAD.left"
            :x2="W - PAD.right"
            :y1="mark.y"
            :y2="mark.y"
          />
        </template>
      </g>

      <!-- x 轴标签：标签多时隔一个显示，避免叠字 -->
      <g v-if="!horizontal">
        <text
          v-for="(label, i) in labels"
          v-show="showLabelAt(i, labels.length, tickStep)"
          :key="label + i"
          class="i-chart__tick"
          :x="isBar ? PAD.left + bandWidth * (i + 0.5) : x(i)"
          :y="height - 8"
          text-anchor="middle"
          :opacity="labels.length > 12 && i % 2 === 1 ? 0 : 1"
        >
          {{ label }}
        </text>
      </g>

      <!--
        目标线：与阈值分开画。阈值说的是「越过就有问题」，目标说的是「要达到」——
        用危险色画目标，会让一个还没达成的目标看起来像一次故障。
      -->
      <g v-if="props.target && horizontal">
        <line
          class="i-chart__target-line"
          :x1="hx(props.target.value)"
          :x2="hx(props.target.value)"
          :y1="PAD.top"
          :y2="PAD.top + plotH"
        />
        <text class="i-chart__target-label" :x="hx(props.target.value)" :y="PAD.top - 4" text-anchor="middle">
          {{ props.target.label || `目标 ${props.target.value}` }}
        </text>
      </g>
      <g v-else-if="props.target">
        <line
          class="i-chart__target-line"
          :x1="PAD.left"
          :x2="W - PAD.right"
          :y1="y(props.target.value)"
          :y2="y(props.target.value)"
        />
        <text class="i-chart__target-label" :x="W - PAD.right" :y="y(props.target.value) - 4" text-anchor="end">
          {{ props.target.label || `目标 ${props.target.value}` }}
        </text>
      </g>

      <!-- 柱 -->
      <g v-if="isBar && !horizontal">
        <template v-for="(s, si) in visible" :key="s.name">
          <rect
            v-for="(value, i) in s.data"
            :key="`${s.name}-${i}`"
            class="i-chart__bar"
            :x="barX(si, i)"
            :y="stacked ? y(stackBase(i, si) + value) : y(Math.max(0, value))"
            :width="Math.max(1, barWidth)"
            :height="Math.max(0, Math.abs(y(value) - y(0)))"
            :fill="colorOf(s.name)"
            :rx="stacked && si !== visible.length - 1 ? 0 : 3"
            :opacity="active === null || active === i ? 1 : 0.55"
          />
        </template>
      </g>

      <!-- 横条 -->
      <g v-else-if="horizontal">
        <rect
          v-for="bar in hBars"
          :key="bar.key"
          class="i-chart__bar"
          :x="bar.x"
          :y="bar.y"
          :width="bar.width"
          :height="bar.height"
          :fill="colorOf(bar.name)"
          :rx="bar.rounded ? 3 : 0"
          :opacity="active === null || active === bar.dataIndex ? 1 : 0.55"
        />
      </g>

      <!-- 线与面积 -->
      <g v-else>
        <!-- 每层画成上下沿之间的带状区域，颜色才等于系列色而不是叠出来的混合色 -->
        <path
          v-for="s in (type === 'area' ? areaSeries : [])"
          :key="`area-${s.name}`"
          class="i-chart__area"
          :d="stackedArea
            ? bandPath(s.base, s.data, scale.min, scale.max, plotW, plotH)
            : areaPath(s.data, scale.min, scale.max, plotW, plotH)"
          :fill="colorOf(s.name)"
          :transform="`translate(${PAD.left} ${PAD.top})`"
        />
        <path
          v-for="s in (type === 'area' ? areaSeries : visible)"
          :key="`line-${s.name}`"
          class="i-chart__line"
          :d="curve === 'step'
            ? stepPath(s.data, axisFor(s.name)?.min ?? scale.min, axisFor(s.name)?.max ?? scale.max, plotW, plotH)
            : linePath(s.data, axisFor(s.name)?.min ?? scale.min, axisFor(s.name)?.max ?? scale.max, plotW, plotH)"
          :stroke="colorOf(s.name)"
          :transform="`translate(${PAD.left} ${PAD.top})`"
        />
        <!-- 末点直接标注：读者不必在图例与线之间来回找 -->
        <!-- 双轴时右边让给刻度与单位：末点标注再挤进去，两样都读不清 -->
        <template v-if="labelLast && !dual">
          <g v-for="row in endLabels" :key="`label-${row.name}`">
            <circle
              :cx="x(labels.length - 1)"
              :cy="y(row.plotted)"
              r="4"
              class="i-chart__dot"
              :fill="colorOf(row.name)"
            />
            <text class="i-chart__label" :x="x(labels.length - 1) + 10" :y="row.y + 4">
              {{ row.name }} {{ formatTick(row.value) }}
            </text>
          </g>
        </template>
      </g>

      <!--
        阈值标签画在数据之上，而线与带留在数据之下。
        标签跟着色带一起沉到底层时，数据线会正好从字上穿过——描边光晕也救不回来，
        因为压在上面的是后画的线。层次分开，形状仍是背景，文字仍然可读。
      -->
      <g v-if="marks.length">
        <text
          v-for="(mark, mi) in marks"
          :key="`mark-label-${mi}`"
          class="i-chart__mark-label"
          :class="`is-${mark.status}`"
          :x="W - PAD.right - 4"
          :y="mark.y + (mark.kind === 'band' ? 14 : -5)"
          text-anchor="end"
        >
          {{ mark.label }}
        </text>
      </g>

      <!-- 悬停：十字线 + 命中点 -->
      <g v-if="active !== null && !isBar">
        <line
          class="i-chart__crosshair"
          :x1="x(active)"
          :x2="x(active)"
          :y1="PAD.top"
          :y2="height - PAD.bottom"
        />
        <circle
          v-for="s in (type === 'area' ? areaSeries : visible)"
          :key="`hit-${s.name}`"
          class="i-chart__dot"
          :cx="x(active)"
          :cy="yIn(s.name, s.data[active] ?? 0)"
          r="4.5"
          :fill="colorOf(s.name)"
        />
      </g>
    </svg>

    <div v-if="active !== null" class="i-chart__tooltip" :style="tooltipStyle">
      <div class="i-chart__tooltip-title">{{ labels[active] }}</div>
      <div v-for="s in visible" :key="`tip-${s.name}`" class="i-chart__tooltip-row">
        <span class="i-chart__swatch" :style="{ background: colorOf(s.name) }" />
        <span>{{ s.name }}</span>
        <span class="i-chart__tooltip-value">{{ formatTick(s.data[active] ?? 0) }}{{ unit }}</span>
      </div>
    </div>

    <!-- 两个以上系列必有图例：颜色不能是识别身份的唯一通道 -->
    <div v-if="series.length > 1" class="i-chart__legend">
      <button
        v-for="s in series"
        :key="`legend-${s.name}`"
        class="i-chart__legend-item"
        :class="{ 'is-off': hidden.has(s.name) }"
        :aria-pressed="String(!hidden.has(s.name))"
        @click="toggle(s.name)"
      >
        <span class="i-chart__swatch" :style="{ background: colorOf(s.name) }" />
        {{ s.name }}
      </button>
    </div>

    <!-- 换算不了的列与目标达成情况都写出来，不让读者自己看出来 -->
    <p v-if="percentSkipped.length" class="i-chart__hint">
      有 {{ percentSkipped.length }} 列没有换算成百分比：{{
        percentSkipped.some((c) => c.reason === 'zero-total') ? '整列为 0 时没有分母；' : ''
      }}{{
        percentSkipped.some((c) => c.reason === 'has-negative') ? '含负值时「占总量的百分之多少」不成立。' : ''
      }}
    </p>
    <p v-for="issue in dual?.issues ?? []" :key="issue" class="i-chart__hint">{{ issue }}</p>
    <p v-if="dualIgnored" class="i-chart__hint">
      双轴只对折线生效：柱状与面积要一个系列一个图型，那是另一件事，这里没有假装支持。
    </p>
    <p v-if="thresholdsDropped" class="i-chart__hint">
      横条暂不画阈值线：竖着的阈值线会被读成分隔栏。需要阈值请用纵向柱状图。
    </p>
    <p v-if="target" class="i-chart__hint">
      {{ target.reached ? '已达成目标' : `距目标还差 ${target.gap}` }}
    </p>

    <div v-if="exits" class="i-chart__actions">
      <button class="i-chart__table-toggle" @click="showTable = !showTable">
        {{ showTable ? locale.chartTableHide : locale.chartTableShow }}
      </button>
      <button class="i-chart__table-toggle" @click="exportCsv">导出 CSV</button>
    </div>
    <table v-if="exits && showTable" class="i-chart__table">
      <thead>
        <tr>
          <th>{{ title || locale.chartCategory }}</th>
          <th v-for="s in series" :key="`th-${s.name}`">{{ s.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(label, i) in labels" :key="`tr-${label}-${i}`">
          <td>{{ label }}</td>
          <td v-for="s in series" :key="`td-${s.name}-${i}`">{{ formatTick(s.data[i] ?? 0) }}{{ unit }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
